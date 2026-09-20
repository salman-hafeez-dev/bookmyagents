import About from '../components/pages/about';
import SEO from '../components/SEO';
import Wrapper from '../layouts/Wrapper';

const AboutMain = () => {
   return (
      <Wrapper>
         <SEO
            pageTitle={'About Us'}
            description="Book My Travel Agents connects travellers with verified travel agents across Pakistan. Learn how we check agents and how the marketplace works."
            canonical="/about"
         />
         <About />
      </Wrapper>
   );
};

export default AboutMain;