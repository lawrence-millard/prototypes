import { Reveal } from '@/components/reveal'
import { Shell } from '@/components/shell'

export default function Page() {
  return (
    <Shell menu={null} mark="#" name="secret">
      <Reveal />
    </Shell>
  )
}
