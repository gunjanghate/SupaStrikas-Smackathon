import MagicBento from '../MagicBento/MagicBento'

import React from 'react'

const Feat1 = () => {
  return (
    <div className=' bg-black py-24 min-h-screen flex flex-col justify-center items-center'>

<MagicBento 
  textAutoHide={true}
  enableStars={true}
  enableSpotlight={true}
  enableBorderGlow={true}
  enableTilt={true}
  enableMagnetism={true}
  clickEffect={true}
  spotlightRadius={300}
  particleCount={52}
  glowColor="132, 0, 255"
/>
    </div>
  )
}

export default Feat1
