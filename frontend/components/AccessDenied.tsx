import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'

const AccessDenied = ({ message }: { message: string }) => (
  <Alert variant="destructive" className="my-8 max-w-lg mx-auto">
    <div className="flex items-center gap-2 mb-1">
      <AlertCircleIcon className="w-5 h-5" />
      <AlertTitle>Accès refusé</AlertTitle>
    </div>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
)

export default AccessDenied
