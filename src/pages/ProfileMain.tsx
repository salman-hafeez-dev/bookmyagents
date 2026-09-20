import Profile from "../components/pages/profile/index"
import SEO from "../components/SEO"
import Wrapper from "../layouts/Wrapper"

const ProfileMain = () => {
    return (
        <Wrapper>
            {/* A signed-in user’s own profile — private. */}
            <SEO pageTitle={'Profile'} noIndex />
            <Profile />
        </Wrapper>
    )
}

export default ProfileMain
