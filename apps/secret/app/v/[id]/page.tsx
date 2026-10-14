import { Reveal } from '@/components/reveal'
import { Shell } from '@/components/shell'

export default function Page() {
  return (
    <Shell mark="#" name="secret">
      <Reveal />
    </Shell>
  )
}
