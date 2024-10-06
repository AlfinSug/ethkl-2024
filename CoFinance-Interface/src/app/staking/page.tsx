'use client';
import React, { useState, useEffect, useRef } from 'react';
import Select, { components } from 'react-select';
import { ethers } from 'ethers';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '@sweetalert2/theme-dark/dark.css';
import { Button } from '../../components/ui/moving-border';
import { getIncentivizedPools } from '@/utils/Factory';
import { getLiquidityToken, getStakingContract } from '@/utils/CoFinance';
import { stakeTokens } from '@/utils/Staking';
import { getTokenInfo, getTokenBalance, approveToken } from '@/utils/TokenUtils';
import { FaWalking, FaWallet } from 'react-icons/fa';


const MySwal = withReactContent(Swal);


const customStyles = {
  control: (base) => ({
    ...base,
    background: 'rgba(20, 20, 20, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  }),
  menu: (base) => ({
    ...base,
    background: 'rgba(20, 20, 20, 0.7)',
  }),
  option: (base, { isFocused }) => ({
    ...base,
    background: isFocused ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: 'white',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'white',
  }),
  input: (base) => ({
    ...base,
    color: 'white',
  }),
};

const CustomOption = (props) => (
  <components.Option {...props}>
    <div className="flex flex-col">
      <span>{props.data.label}</span>
      <span className="text-gray-400 text-sm">Available Balance: {props.data.balance}</span>
    </div>
  </components.Option>
);

const stakingDurations = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 21, label: '21 Days' },
];


function Staking() {
  const [selectedPool, setSelectedPool] = useState(null);
  const [amountPool, setAmountPool] = useState('');
  const [stakingDurationPool, setStakingDurationPool] = useState(null);
  const [aprPool, setAprPool] = useState(null);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [balance, setBalance] = useState('0');
  const providerRef = useRef(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const loadProviderAndAccount = async () => {
      if (window.ethereum) {
        providerRef.current = new ethers.BrowserProvider(window.ethereum);
        const signer = await providerRef.current.getSigner();
        const accountAddress = await signer.getAddress();
        setAccount(accountAddress);
      } else {
        console.error("Ethereum provider not found.");
      }
    };
    loadProviderAndAccount();
  }, []);

  useEffect(() => {
    const fetchIncentivizedPools = async () => {
      if (!providerRef.current) return;
      try {
        const pools = await getIncentivizedPools(providerRef.current);
        const poolAddresses = Array.from(pools);

        const options = await Promise.all(
          poolAddresses.map(async (poolAddress) => {
            const liquidityToken = await getLiquidityToken(providerRef.current, poolAddress);
            const stakingAddress = await getStakingContract(providerRef.current, poolAddress);
            console.log(stakingAddress);
            let tokenInfo = {};
            let balance = '0';

            try {
              tokenInfo = await getTokenInfo(providerRef.current, liquidityToken);
              balance = await getTokenBalance(providerRef.current, liquidityToken, account);
            } catch (error) {
              tokenInfo = { value: liquidityToken, label: 'Unsupported Token', image: '/tokens/Missing-Token.png' };
            }

            return {
              value: tokenInfo.value,
              label: tokenInfo.label,
              poolAddress,
              stakingAddress, // Include staking address in the options
              balance: balance || '0',
              image: tokenInfo.image,
            };
          })
        );

        setTokenOptions(options);
      } catch (error) {
        console.error('Error fetching incentivized pools:', error);
      }
    };

    fetchIncentivizedPools();
  }, [account]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedPool || !account) return;
      try {
        const balance = await getTokenBalance(providerRef.current, selectedPool.value, account);
        setBalance(balance.toString());
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, [selectedPool, account]);

  const calculateApr = (duration, baseApr) => {
    const durationMultiplier = duration / 21;
    return baseApr * durationMultiplier;
  };

  const handleStakePool = async () => {
    if (!selectedPool || !stakingDurationPool) {
      console.log('Pool or duration not selected');
      return;
    }

    const baseApr = 5;
    setAprPool(calculateApr(stakingDurationPool.value, baseApr));

    try {
      await approveToken(providerRef.current, selectedPool.value, selectedPool.stakingAddress, amountPool.toString());
      await stakeTokens(providerRef.current, selectedPool.stakingAddress, amountPool.toString());
      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Staked ${amountPool} of ${selectedPool.label} for ${stakingDurationPool.label}.`,
        customClass: {
          popup: 'my-custom-popup',
          confirmButton: 'my-custom-confirm-button',
        },
      });

    } catch (error) {
      console.error('Error staking:', error);
      // Show error alert if any error occurs
      MySwal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'There was an issue with your staking request.',
        customClass: {
          popup: 'my-custom-popup',
          confirmButton: 'my-custom-confirm-button',
        },
      });
    }
  };

  return (
    <section className="min-h-screen animation-bounce bg-faucet bg-no-repeat bg-contain image-full">
      <div className="pt-40 px-96 space-y-3">
        <h1 className="text-lg md:text-7xl text-center font-sans font-bold mb-8 text-white">CoFinance Staking Yield</h1>
        <div role="alert" className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info h-6 w-6 shrink-0">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Your Staked Pools</span>
        </div>
        <div className="bg-[#141414] rounded-xl h-full p-5 space-y-3">
          <div className='flex items-center justify-between space-x-3'>
            <div className="w-full">
              <label className="block text-white mb-2">Pools</label>
              <Select
                options={tokenOptions}
                value={selectedPool}
                onChange={setSelectedPool}
                styles={customStyles}
                components={{ Option: CustomOption }}
                placeholder="Select Pool"
              />
            </div>
            <div className="w-full">
              <label className="block text-white mb-2">Amount</label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={amountPool}
                  onChange={(e) => setAmountPool(e.target.value)}
                  placeholder="Amount"
                  className="text-right w-full rounded-xl p-5 text-3xl bg-transparent focus:border-0 text-white placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="w-full space-y-4 border border-gray-500 px-3 py-5 rounded-sm">
            <div role="alert" className="alert shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-info h-6 w-6 shrink-0">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-bold">Available Balance</h3>
                <div className="text-lg">{balance}</div>
              </div>
              <button className="btn btn-sm">Estimated APR :
                {` `} <strong>{aprPool ? `${aprPool}%` : '0%'}</strong>
              </button>
            </div>
            <input
              type="range"
              min="0"
              max={balance}
              value={amountPool}
              onChange={(e) => setAmountPool(e.target.value)}
              className="custom-slider w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Staking Duration</label>
            <div className="grid grid-cols-3 gap-4">
              {stakingDurations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setStakingDurationPool(duration)}
                  className={`p-2 rounded-lg text-white ${stakingDurationPool?.value === duration.value ? 'bg-gray-600' : 'bg-gray-700'}`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>
          <div className="py-3">
            <button
              onClick={handleStakePool}
              className="bg-gray-400 w-full font-normal text-lg my-2 transition duration-300 text-gray-950 p-4 rounded-lg"
            >
              Stake Pool
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Staking;