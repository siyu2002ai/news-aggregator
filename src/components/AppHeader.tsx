import type { FC } from 'react';

const AppHeader: FC = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold tracking-tight">News Digest Hub</h1>
      </div>
    </header>
  );
};

export default AppHeader;
