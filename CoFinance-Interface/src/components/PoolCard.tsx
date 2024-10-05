import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/moving-border';
import AddLiquidityModal from './inner-page/AddLiquidityModal';
import WithdrawLiquidityModal from './inner-page/WithdrawLiquidityModal';
import { MdOutlineVerticalDistribute } from 'react-icons/md';

const DEFAULT_IMAGE_URL = '/tokens/Missing-Token.png';

interface PoolCardProps {
  pool: {
    address: string;
    liquidity?: {
      totalA: string;
      totalB: string;
    };
    tokenA?: {
      label: string;
      image: string;
    };
    tokenB?: {
      label: string;
      image: string;
    };
  };
  onWithdrawClick: () => void;
  onAddLiquidityClick: () => void;


}

const PoolCard: React.FC<PoolCardProps> = ({ pool }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const handleButtonClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleAddPool = () => {
    setAddModalOpen(true);
    setMenuOpen(false);
  };

  const handleWithdrawPool = () => {
    setWithdrawModalOpen(true);
    setMenuOpen(false);
  };

  return (
    <div className="relative bg-transparent hover:bg-teal-950 p-4 rounded-lg shadow-lg flex items-center w-full">
      <div className="avatar-group -space-x-6 rtl:space-x-reverse">
        <div className="avatar">
          <div className="w-12">
            <img src={pool.tokenA?.image || DEFAULT_IMAGE_URL}
              alt={pool.tokenA?.label || 'Default Token'} />
          </div>
        </div>
        <div className="avatar">
          <div className="w-12">
            <img src={pool.tokenB?.image || DEFAULT_IMAGE_URL}
              alt={pool.tokenB?.label || 'Default Token'} />
          </div>
        </div>
      </div>
      <div className="flex-grow px-4">
        <h3 className="text-xl font-semibold text-white">
          {pool.tokenA?.label || 'Token A'} / {pool.tokenB?.label || 'Token B'}
        </h3>
      </div>
      <div className="flex-grow px-4">
        <p className="text-gray-400">{pool.liquidity ? pool.liquidity.totalA : '0'} </p>
      </div>
      <div className="flex-grow px-4">
        <p className="text-gray-400">{pool.liquidity ? pool.liquidity.totalB : '0'} </p>
      </div>
      <div className="relative">
        <button
          onClick={handleButtonClick}
          className="text-white px-4 py-2 rounded-md focus:outline-none"
        >
          <MdOutlineVerticalDistribute />
        </button>
        {menuOpen && (
          <div className="absolute top-full w-64 text-nowrap right-0 mt-2 text-white p-2 rounded-lg shadow-lg z-10 bg-transparent shadow-md shadow-teal-700">
            <button
              onClick={handleAddPool}
              className="block w-full text-left p-2 rounded-md hover:bg-teal-700"
            >
              Add Liquidity
            </button>
            <button
              onClick={handleWithdrawPool}
              className="block w-full text-left p-2 rounded-md hover:bg-teal-700"
            >
              Withdraw
            </button>
          </div>
        )}
      </div>

      <AddLiquidityModal
        open={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        tokenA={pool.tokenA}
        tokenB={pool.tokenB}
      />

      <WithdrawLiquidityModal
        open={isWithdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        tokenA={pool.tokenA}
        tokenB={pool.tokenB}
      />
    </div>
  );
};

export default PoolCard;
