
import Link from 'next/link'

import {Linkedin, Twitter} from 'lucide-react';



export const Component = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative overflow-hidden">
   <footer className="mt-4 pb-32 lg:pb-56 max-w-3xl lg:max-w-5xl text-base-content mx-auto">
      <div className="relative bg-stone-200 rounded-3xl max-w-3xl lg:max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-start justify-between  gap-4 md:gap-10 px-2 md:px-8 flex-1">
          <div className='flex flex-col items-start gap-2'>
          <Link
            href="/"
            className="flex flex-row  gap-1 items-center justify-start text-2xl font-display bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent"
          >
            
            MintMyTicket
          </Link>
          <p className='text-neutral/50 font-medium text-base w-full md:w-4/5'>Behavioral Designed Activation Journeys for PLG SaaS to lift Aha! moments by 23%.</p>
          </div>

          <div className='flex flex-col md:mx-4 md:flex-row gap-2 md:gap-20 items-start md:items-start'>

          <div className='flex flex-col gap-1 md:gap-4'>
          <h4 className='uppercase font-display text-md text-black font-semibold'>Resources</h4>
          <div className="flex flex-wrap md:flex-col gap-2 text-sm text-neutral items-start ">
            <Link className='text-neutral/50 whitespace-nowrap font-medium' href="/resources/freebies">Freebies & Audits</Link>
            <Link className='text-neutral/50 whitespace-nowrap font-medium' href="/resources/tools">Tools</Link>
            <Link className='text-neutral/50 whitespace-nowrap font-medium' href="/resources/behavior-principles">Psychology</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/resources/blog">Blog <span className='inline-flex ml-1 py-0.5 px-3 bg-purple-200 text-xs rounded-xl -rotate-3'>soon</span> </Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/resources/components">Components <span className='inline-flex ml-1 py-0.5 px-3 bg-purple-200 text-xs rounded-xl -rotate-3'>soon</span> </Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/resources/playbooks">Playbooks <span className='inline-flex ml-1 py-0.5 px-3 bg-purple-200 text-xs rounded-xl rotate-3'>soon</span></Link>
          </div>
          </div>

          <div className='hidden md:flex flex-col gap-1 md:gap-4'>
          <h4 className='uppercase whitespace-nowrap font-display text-md text-black font-semibold'>Company <span className='inline-flex  ml-1 py-0.5 px-3 bg-purple-200 text-xs rounded-xl rotate-3'>soon</span></h4>
          <div className="flex gap-2 flex-wrap md:flex-col text-sm text-neutral items-start ">
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/company/mission">Mission</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/company/ecosystem">SaaS Ecosystem</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/company/affiliates">Affiliate Program</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/company/referrals">Referral Program</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/company/partners">Partners</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/company/about-us">About Us</Link>
          </div>
          </div>
          
          <div className='hidden md:flex flex-col gap-1 gap-4'>
          <h4 className='uppercase whitespace-nowrap font-display text-md text-black font-semibold'>Compare <span className='inline-flex  ml-1 py-0.5 px-3 bg-purple-200 text-xs rounded-xl rotate-3'>soon</span></h4>
          <div className="flex flex-col gap-2 text-sm text-neutral items-start ">
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/legal/privacy-policy">DaaS</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/legal/tos">PLG Boutique</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/legal/tos">ProductLed</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/legal/tos">Vulnabyl</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/pricing">GrowthMates</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/pricing">DelightPath</Link>
            <Link className='pointer-events-none text-neutral/50 whitespace-nowrap font-medium' href="/pricing"></Link>
          </div>
          </div>
        </div>

        </div>
      </div>
      <div className="my-3 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm text-neutral">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 items-start sm:items-center text-purple-400">
          <p className="whitespace-nowrap ">
            ©{currentYear} MintMyTicket. All rights reserved.
          </p>
          <div className="flex flex-row gap-4">
            <Link href="/legal/privacy-policy">Privacy Policy</Link>
            <Link href="/legal/tos">Terms &#38; Co</Link>
            <Link href="https://www.linkedin.com/in/radu-a-popescu/">
              Radu Popescu
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <a
            href="https://www.linkedin.com/in/radu-a-popescu/"
            target="_blank"
            rel="nofollow noopener"
            aria-label="Radu Popescu, Founder of ActivationLed Linkedin"
            className="hover:text-gray-900 text-purple-400"
          >
            <Linkedin className="w-5 h-5 fill-neutral" />
          </a>
          <a
            href="https://x.com/activation_guy"
            target="_blank"
            rel="nofollow noopener"
            aria-label="X (formerly Twitter)"
            className="hover:text-gray-900"
          >
            <Twitter className="w-5 h-5 fill-neutral text-purple-400" />
          </a>
        </div>

      </div>
    </footer>
        <div className="text-center absolute bottom-0 lg:-bottom-5 left-0 right-0  text-transparent bg-clip-text bg-gradient-to-b from-gray-100/50 to-gray-800 text-6xl lg:text-[9em] font-semibold font-sans">
          MINTMYTICKET
        </div>
        </div>
  );
};
