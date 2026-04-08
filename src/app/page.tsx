import Providers from '@/app/Providers';
import RootWrapper from '@/app/wrapper';
import HomePageContent from '@/components/HomePageContent';

export default function Home() {
  return (
    <Providers>
      <RootWrapper>
        <HomePageContent />
      </RootWrapper>
    </Providers>
  );
}
