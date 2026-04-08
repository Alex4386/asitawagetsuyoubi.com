import Providers from '@/app/Providers';
import RootWrapper from '@/app/wrapper';
import HomePageContent from '@/components/HomePageContent';

export default function ForcePage() {
  return (
    <Providers initialTeaseOmaeraOverride={true}>
      <RootWrapper>
        <HomePageContent />
      </RootWrapper>
    </Providers>
  );
}
