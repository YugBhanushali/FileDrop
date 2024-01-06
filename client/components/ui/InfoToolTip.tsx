import React from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "./tooltip"
import { Button } from './button'
import { InfoIcon } from 'lucide-react'

const InfoToolTip = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className=' rounded-full p-3'><InfoIcon size={18}/></Button>
        </TooltipTrigger>
        <TooltipContent className='w-[200px]'>
          <p>Ensure that both peers are on the same network to enable file transfers.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default InfoToolTip