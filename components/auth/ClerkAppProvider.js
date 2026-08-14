import { zhCN } from '@clerk/localizations'
import { ClerkProvider, useUser } from '@clerk/nextjs'

const ClerkUserBridge = ({ render }) => {
  const { isLoaded, isSignedIn, user } = useUser()
  return render({ isLoaded, isSignedIn, user })
}

/**
 * Clerk lives in its own async chunk so pages without authentication do not
 * pay for the SDK or localization dictionary.
 */
const ClerkAppProvider = ({ render }) => {
  return (
    <ClerkProvider localization={zhCN}>
      <ClerkUserBridge render={render} />
    </ClerkProvider>
  )
}

export default ClerkAppProvider
