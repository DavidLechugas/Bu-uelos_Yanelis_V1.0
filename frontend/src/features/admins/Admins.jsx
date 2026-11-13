import { adminsApi } from '../../api/client.js';
import { ADMIN_TEAM, TeamSection } from '../team/TeamSection.jsx';

export function Admins(props) {
  return <TeamSection config={ADMIN_TEAM} api={adminsApi} {...props} />;
}
