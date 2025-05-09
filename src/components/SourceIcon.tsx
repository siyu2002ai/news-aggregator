
import type { FC } from 'react';
import { cn } from "@/lib/utils"; // Corrected: cn is imported from lib/utils

interface SourceIconProps {
  sourceName: string;
  className?: string;
}

const SourceIcon: FC<SourceIconProps> = ({ sourceName, className = "w-6 h-6" }) => {
  switch (sourceName.toLowerCase()) {
    case 'reddit':
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={cn("text-orange-500", className)}
          aria-label="Reddit Icon"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.24 13.688c-.336.338-.83.34-1.17.002-.17-.17-.276-.404-.276-.653 0-.25.106-.482.275-.652.335-.335.83-.334 1.168.002.17.17.275.404.275.652 0 .25-.105.483-.273.65zm-4.112-1.487c-.898 0-1.625.728-1.625 1.626s.727 1.625 1.625 1.625 1.625-.727 1.625-1.625-.727-1.626-1.625-1.626zm-5.016 3.44c.095.096.22.143.346.143.128 0 .25-.047.345-.143.193-.19.193-.5 0-.693-.095-.095-.218-.143-.345-.143s-.25.048-.346.143c-.193.193-.193.502 0 .694zm.508-5.443c.87 0 1.576.974 1.576 2.174 0 .49-.142.94-.39 1.32-.45.704-1.16 1.143-1.95 1.143h-.01c-.79 0-1.5-.438-1.95-1.143-.248-.38-.39-.83-.39-1.32 0-1.2.707-2.174 1.575-2.174zm5.274-2.963c0-.808.656-1.463 1.464-1.463s1.464.655 1.464 1.463c0 .81-.656 1.464-1.464 1.464s-1.464-.655-1.464-1.464zm-7.02.213c0 .43.348.778.777.778s.777-.348.777-.778-.348-.777-.777-.777-.777.347-.777.777zM12 6.75c-1.962 0-3.71.96-4.792 2.547-.18.26-.06.623.22.783.278.17.63.04.79-.24.84-1.26 2.205-2.04 3.782-2.04s2.942.78 3.782 2.04c.16.28.512.41.79.24.28-.16.398-.522.22-.783C15.71 7.71 13.962 6.75 12 6.75z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={cn("text-red-600", className)}
          aria-label="YouTube Icon"
        >
          <path d="M21.582 7.498c-.27-.996-.988-1.714-1.984-1.984C17.996 5.25 12 5.25 12 5.25s-5.996 0-7.598.264c-.996.27-1.714.988-1.984 1.984C2.25 9.098 2.25 12 2.25 12s0 2.902.268 4.502c.27.996.988 1.714 1.984 1.984C5.004 18.75 12 18.75 12 18.75s5.996 0 7.598-.264c.996-.27 1.714-.988 1.984-1.984C21.75 14.902 21.75 12 21.75 12s0-2.902-.168-4.502zM9.75 14.85V9.15l4.875 2.85-4.875 2.85z"/>
        </svg>
      );
    case 'nyt':
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={cn("text-black dark:text-white", className)} // Adjusted for dark mode
          aria-label="New York Times Icon"
        >
         <path d="M12.515 4.052h-1.03L8.08 13.837V4.052H7.02v15.896h1.088l3.34-9.614v9.614h1.058V4.052zM4.003 19.948V4.052H2v15.896h2.003zm15.994 0V4.052H18v15.896h1.997z"/>
        </svg>
      );
    case 'wsj':
      return (
        <div className={cn("font-serif font-bold flex items-center justify-center text-foreground", className)} aria-label="Wall Street Journal Icon">
          WSJ
        </div>
      );
    case 'rhg':
      return (
        <div className={cn("font-sans font-semibold flex items-center justify-center text-foreground", className)} aria-label="Rhodium Group Icon">
          RHG
        </div>
      );
    case 's&amp;p global':
      return (
        <div className={cn("font-sans font-semibold flex items-center justify-center text-blue-600 dark:text-blue-400", className)} aria-label="S&amp;P Global Icon">
          S&amp;P
        </div>
      );
    default:
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={className}
          aria-label="Default News Icon"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      );
  }
};

export default SourceIcon;
