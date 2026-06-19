import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { WizardProvider } from '@/store/wizard'

export default function App() {
  return (
    <WizardProvider>
      <RouterProvider router={router} />
    </WizardProvider>
  )
}
