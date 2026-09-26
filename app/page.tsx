import { loadFixtures } from './lib/fixtures'
import ConsentApp from './components/ConsentApp'

export default function Home() {
  const fixtures = loadFixtures()
  return <ConsentApp fixtures={fixtures} />
}
