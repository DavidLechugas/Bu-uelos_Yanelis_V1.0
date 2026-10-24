import { adminsApi } from '../../api/client.js';
import { ADMIN_TEAM, TeamSection } from '../team/TeamSection.jsx';

export function Admins({ active = true }) {
  return <TeamSection config={ADMIN_TEAM} api={adminsApi} active={active} />;
}
