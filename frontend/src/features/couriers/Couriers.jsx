import { couriersApi } from '../../api/client.js';
import { COURIER_TEAM, TeamSection } from '../team/TeamSection.jsx';

export function Couriers({ active = true }) {
  return <TeamSection config={COURIER_TEAM} api={couriersApi} active={active} />;
}
