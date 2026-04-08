import Providers from '@/app/Providers';
import RootWrapper from '@/app/wrapper';
import HomePageContent from '@/components/HomePageContent';

export default function ForcePage() {
  return (
    <Providers forceTeasing>
      <RootWrapper>
        <HomePageContent />
      </RootWrapper>
    </Providers>
  );
}
