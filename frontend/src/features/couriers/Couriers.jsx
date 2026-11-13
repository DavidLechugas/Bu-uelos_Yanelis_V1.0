import { couriersApi } from '../../api/client.js';
import { COURIER_TEAM, TeamSection } from '../team/TeamSection.jsx';

export function Couriers(props) {
  return <TeamSection config={COURIER_TEAM} api={couriersApi} {...props} />;
}
