import {
  Avatar,
  Icon,
  IconButton,
  Logo,
  Notification,
  Sheet,
  SheetContent,
  SheetTrigger,
  Spacer,
  Spinner,
} from '@hapstack/ui'
import { logout, openLoginTab } from '@src/background/auth'
import type { User } from '@src/background/user'
import { getCurrentUser } from '@src/background/user'
import { Constants } from '@src/utils/constants'
import { createContext, useContext, useEffect, useState } from 'react'

type PopupContextType = {
  loading: boolean
  user: User | null
}

const PopupContext = createContext<PopupContextType | undefined>(undefined)

const usePopupState = () => {
  const context = useContext(PopupContext)
  if (context === undefined) {
    throw new Error('usePopupState must be used within a PopupProvider')
  }
  return context
}

export const Popup = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCurrentUser()
      .then((user) => setUser(user))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PopupContext.Provider value={{ user, loading }}>
      {loading ? (
        <PopupLoading />
      ) : (
        <PopupContainer>
          <PopupContent />
        </PopupContainer>
      )}
    </PopupContext.Provider>
  )
}

const PopupLoading = () => (
  <PopupContainer>
    <div className="py-6 text-4xl text-accent">
      <Spinner />
    </div>
  </PopupContainer>
)

const PopupContainer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = usePopupState()

  if (!user && !loading) openLoginTab()

  return (
    <section className="relative flex h-fit w-72 justify-center px-4 pb-4 pt-2 font-sans text-sm antialiased">
      {user ? <SidebarMenu /> : null}
      <div className="flex flex-col items-center">
        <div className="py-3.5">
          <Logo width={130} />
        </div>
        <Spacer size="sm" />
        {children}
      </div>
    </section>
  )
}

const PopupContent = () => {
  const { user } = usePopupState()

  async function handleLogout() {
    await logout()
    openLoginTab()
  }

  if (!user) return null

  return (
    <div className="w-full space-y-4">
      <div className="flex w-full items-center rounded border border-border bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar
            fullName={user.fullName}
            url={user.avatarUrl}
            size="sm"
          />
          <div className="flex max-w-full flex-col">
            <div className="truncate font-medium">{user.fullName}</div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      </div>
      <Notification
        variant={user.isTracked ? 'success' : 'warning'}
        className="py-2 text-sm"
        icon="check-circle-2"
      >
        <div className="flex w-full items-center justify-between">
          <p>
            Activity sharing is {user.isTracked ? 'enabled' : 'inactive'}.{' '}
            {!user.isTracked ? (
              <span>
                Please{' '}
                <button
                  className="underline"
                  onClick={handleLogout}
                >
                  log out
                </button>{' '}
                and back in again to enable sharing.
              </span>
            ) : null}
          </p>
        </div>
      </Notification>
    </div>
  )
}

const SidebarMenu = () => {
  const { user } = usePopupState()

  async function handleLogout() {
    await logout()
    window.close()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton
          icon="menu"
          label="open menu"
          className="absolute inset-4 mt-1 text-xl"
        />
      </SheetTrigger>
      <SheetContent
        hideCloseButton
        side={'left'}
        className="border-none bg-primary p-0 text-white"
      >
        <ul className="divide-y divide-secondary/30">
          <li className="flex items-center gap-2 px-3 py-4">
            <Icon name="user-circle-2" />
            <a
              href={`${Constants.webAppUrl}/team/${user?.id}`}
              target="_blank"
              className="underline-offset-2 hover:underline"
              rel="noreferrer"
            >
              My account
            </a>
          </li>
          <li className="flex items-center gap-2 px-2 py-4">
            <Icon name="log-out" />
            <button
              onClick={handleLogout}
              className="underline-offset-2 hover:underline"
            >
              Log out
            </button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  )
}
