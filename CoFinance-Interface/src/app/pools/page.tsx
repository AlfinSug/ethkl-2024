'use client';
import React, { useState, useEffect } from 'react';
import PoolCard from '../../components/PoolCard';
import { getAllPools } from '../../utils/Factory';
import { getTotalLiquidity, getTokenAddresses, getLiquidityToken } from '../../utils/CoFinance';
import { getTokenInfo } from '../../utils/TokenUtils';
import { ethers } from 'ethers';
import WithdrawLiquidityModal from '@/components/inner-page/WithdrawLiquidityModal';
import AddLiquidityModal from '@/components/inner-page/AddLiquidityModal';
import Drawer from '@/components/Drawer';
import { FaSwimmingPool } from 'react-icons/fa';

interface TokenInfo {
  value: string;
  label: string;
  image: string;
  address?: string;
}

interface Liquidity {
  totalA: number;
  totalB: number;
}

interface Pool {
  address: string;
  liquidity: Liquidity;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  liquidityToken: any; // Adjust this type based on your actual liquidity token structure
}

function Pools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [userOwnedPools, setUserOwnedPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addLiquidityModalOpen, setAddLiquidityModalOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const loadPools = async () => {
      setLoading(true);
      try {
        if (!window.ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accountAddress = await signer.getAddress();
        setAccount(accountAddress);
        console.log("Connected Account: ", accountAddress);

        const poolAddresses = await getAllPools(provider);
        const incentivizedPoolAddresses = await getAllPools(provider);

        console.log("Fetching All Pools...");
        const allPools = await Promise.all(
          poolAddresses.map(async (address, index) => {
            console.log(`Fetching Pool Data for Address ${index + 1}/${poolAddresses.length}: ${address}`);
            return await fetchPoolData(provider, address);
          })
        );

        console.log("Fetching User Owned Pools...");
        const userOwned = await Promise.all(
          incentivizedPoolAddresses.map(async (address, index) => {
            console.log(`Fetching User Owned Pool Data for Address ${index + 1}/${incentivizedPoolAddresses.length}: ${address}`);
            return await fetchPoolData(provider, address);
          })
        );

        console.log("All Pools Data:", allPools);
        console.log("User Owned Pools Data:", userOwned);

        setPools(allPools);
        setUserOwnedPools(userOwned);
      } catch (error) {
        console.error('Error loading pools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPools();
  }, []);

  const fetchPoolData = async (provider: ethers.BrowserProvider, address: string): Promise<Pool> => {
    console.log(`Start fetching data for pool at address: ${address}`);
    try {
      const { tokenA, tokenB } = await getTokenAddresses(provider, address);
      console.log(`Token addresses for pool ${address}: A = ${tokenA}, B = ${tokenB}`);

      const [tokenAInfo, tokenBInfo, liquidityToken] = await Promise.all([
        getTokenInfo(provider, tokenA),
        getTokenInfo(provider, tokenB),
        getLiquidityToken(provider, address),
      ]);

      const liquidity = await getTotalLiquidity(provider, address);
      const scaledTotalA = parseFloat(liquidity.totalA);
      const scaledTotalB = parseFloat(liquidity.totalB);
      
      const defaultTokenInfo: TokenInfo = { value: '0', label: 'Unknown', image: '/tokens/Missing-Token.png' };

      const tokenAData = tokenAInfo && tokenAInfo.label ? tokenAInfo : defaultTokenInfo;
      const tokenBData = tokenBInfo && tokenBInfo.label ? tokenBInfo : defaultTokenInfo;

      console.log(`Fetched Pool Data for Address: ${address}`);
      console.log(`Token A: ${tokenAData.label} (${tokenAData.address}) - Value: ${tokenAData.value}`);
      console.log(`Token B: ${tokenBData.label} (${tokenBData.address}) - Value: ${tokenBData.value}`);
      console.log(`Liquidity: Total A: ${scaledTotalA}, Total B: ${scaledTotalB}`);

      return {
        address,
        liquidity: { totalA: scaledTotalA, totalB: scaledTotalB },
        tokenA: {
          value: tokenAData.value,
          label: tokenAData.label,
          image: tokenAData.image,
          address: tokenA,
        },
        tokenB: {
          value: tokenBData.value,
          label: tokenBData.label,
          image: tokenBData.image,
          address: tokenB,
        },
        liquidityToken,
      };
    } catch (error) {
      console.error(`Error fetching liquidity for pool ${address}:`, error);
      return {
        address,
        liquidity: { totalA: 0.0, totalB: 0.0 },
        tokenA: { value: '0', label: 'Unknown', image: '/tokens/Missing-Token.png', address: '' },
        tokenB: { value: '0', label: 'Unknown', image: '/tokens/Missing-Token.png', address: '' },
      };
    } finally {
      console.log(`Finished fetching data for pool at address: ${address}`);
    }
  };

  const handleAddLiquidityClick = (pool: Pool) => {
    if (!account) {
      console.error("Account is not connected!");
      return;
    }
    setSelectedPool(pool);
    setAddLiquidityModalOpen(true);
  };

  const handleWithdrawClick = (pool: Pool) => {
    setSelectedPool(pool);
    setModalOpen(true);
  };

  const DiscoverPools = ({ pools }: { pools: Pool[] }) => (
    <div className="bg-[#141414] p-6 rounded-lg min-w-full h-auto">
      {pools.length === 0 ? (
        <p className="text-white text-center">No pools available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool, index) => (
            <PoolCard
              key={index}
              pool={pool}
              onWithdrawClick={() => handleWithdrawClick(pool)}
              onAddLiquidityClick={() => handleAddLiquidityClick(pool)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const IncentivizedPools = ({ userOwnedPools }: { userOwnedPools: Pool[] }) => (
    <div className="bg-[#141414] p-6 rounded-lg min-w-full h-auto">
      {userOwnedPools.length === 0 ? (
        <p className="text-white text-center">No pools available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userOwnedPools.map((pool, index) => (
            <PoolCard
              key={index}
              pool={pool}
              onWithdrawClick={() => handleWithdrawClick(pool)}
              onAddLiquidityClick={() => handleAddLiquidityClick(pool)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const drawerList = [
    { label: "Discover", content: <DiscoverPools pools={pools} /> },
    { label: "Incentivized", content: <IncentivizedPools userOwnedPools={userOwnedPools} /> },
  ];

  return (
    <section className="min-h-screen bg-pools bg-no-repeat bg-contain py-12 pt-36">
      <div className="px-40">
        <div className="flex items-center justify-between py-6">
          <h2 className="text-4xl font-bold text-white">Overview</h2>
          <button className='btn btn-base-200 rounded-lg' onClick={() => window.location.href = '/addpools'}>
            <FaSwimmingPool /> Add New Pool
          </button>
        </div>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center">
              <span className="loading loading-bars loading-lg"></span>
            </div>
          ) : (
            <Drawer
              drawerItems={drawerList}
              classParent='py-2'
              title=''
              classActiveTab='bg-[#141414] py-2 px-4 text-lg font-medium rounded-sm text-left text-[#bdc3c7]'
              classDeactiveTab='bg-transparent border border-[#bdc3c7] text-lg font-medium py-2 px-4 rounded-sm text-left text-white'
            />
          )}
        </div>
      </div>

      <WithdrawLiquidityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        liquidityToken={{
          label: selectedPool?.liquidityToken?.label || '',
          balance: selectedPool?.liquidityToken?.balance || '0',
          address: selectedPool?.liquidityToken?.address || '',
          image: selectedPool?.liquidityToken?.image || '/tokens/Missing-Token.png',
        }}
      />

      <AddLiquidityModal
        open={addLiquidityModalOpen}
        onClose={() => setAddLiquidityModalOpen(false)}
        tokenA={selectedPool?.tokenA || { label: '', value: '', image: '' }}
        tokenB={selectedPool?.tokenB || { label: '', value: '', image: '' }}
        account={account || ''}
        poolAddress={selectedPool?.address || ''}
      />
    </section>
  );
}

export default Pools;
