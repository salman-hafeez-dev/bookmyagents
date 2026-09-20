import BlogOne from '../components/blogs/blog-one'
import SEO from '../components/SEO'
import Wrapper from '../layouts/Wrapper'

const BlogOneMain = () => {
   return (
      <Wrapper>
         <SEO
            pageTitle={'Travel Guides & Advice'}
            description="Travel guides, visa advice and destination tips from verified travel agents across Pakistan."
            canonical="/blog-grid"
         />
         <BlogOne />
      </Wrapper>
   )
}

export default BlogOneMain
