import React, { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { Modal, LinkExternal, Box } from '@pancakeswap-libs/uikit'
import BalanceInput from 'components/BalanceInput'
import useTokenBalance from 'hooks/useTokenBalance'
import { getBalanceNumber } from 'utils/formatBalance'
import useI18n from 'hooks/useI18n'
import ApproveConfirmButtons from 'views/Profile/components/ApproveConfirmButtons'
import useApproveConfirmTransaction from 'hooks/useApproveConfirmTransaction'
import { useERC20 } from 'hooks/useContract'

interface Props {
  currency: string
  contract: any
  currencyAddress: string
  onSuccess: (amount: BigNumber) => void
  onDismiss?: () => void
}

const ContributeModal: React.FC<Props> = ({ currency, contract, currencyAddress, onDismiss, onSuccess }) => {
  const [value, setValue] = useState('')
  const { account } = useWeb3React()
  const raisingTokenContract = useERC20(currencyAddress)
  const balance = getBalanceNumber(useTokenBalance(currencyAddress))
  const TranslateString = useI18n()
  const valueWithTokenDecimals = new BigNumber(value).times(new BigNumber(10).pow(18))
  const {
    isApproving,
    isApproved,
    isConfirmed,
    isConfirming,
    handleApprove,
    handleConfirm,
  } = useApproveConfirmTransaction({
    onRequiresApproval: async () => {
      try {
        const response = await raisingTokenContract.methods.allowance(account, contract.options.address).call()
        const currentAllowance = new BigNumber(response)
        return currentAllowance.gt(0)
      } catch (error) {
        return false
      }
    },
    onApprove: () => {
      return raisingTokenContract.methods
        .approve(contract.options.address, ethers.constants.MaxUint256)
        .send({ from: account })
    },
    onConfirm: () => {
      return contract.methods.deposit(valueWithTokenDecimals.toString()).send({ from: account })
    },
    onSuccess: async () => {
      onDismiss()
      onSuccess(valueWithTokenDecimals)
    },
  })

  return (
    <Modal title={`Contribute ${currency}`} onDismiss={onDismiss}>
      <Box width="344px">
        <BalanceInput
          title={TranslateString(999, 'Contribute')}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          symbol={currency}
          max={balance}
          onSelectMax={() => setValue(balance.toString())}
          mb="24px"
        />
        <ApproveConfirmButtons
          isApproveDisabled={isConfirmed || isConfirming || isApproved}
          isApproving={isApproving}
          isConfirmDisabled={
            !isApproved || isConfirmed || valueWithTokenDecimals.isNaN() || valueWithTokenDecimals.eq(0)
          }
          isConfirming={isConfirming}
          onApprove={handleApprove}
          onConfirm={handleConfirm}
        />
        <LinkExternal
          href="https://exchange.defifarmer.app/#/add/ETH/0xba26397cdff25f0d26e815d218ef3c77609ae7f1"
          style={{ margin: '16px auto 0' }}
        >
          {`Get ${currency}`}
        </LinkExternal>
      </Box>
    </Modal>
  )
}

export default ContributeModal
