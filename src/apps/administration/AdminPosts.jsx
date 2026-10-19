import { invalidatePublicData } from '../../services/publicDataService';
import NotesAdmin from '../notes/NotesAdmin';
const refresh = () => {
  invalidatePublicData('/api/posts');
  window.dispatchEvent(new Event('ws-os:posts-changed'));
};
export default function AdminPosts({ instanceId, authorized }) {
  return (
    <NotesAdmin
      instanceId={instanceId}
      isAdmin={authorized}
      refreshPublicPosts={refresh}
      onDeletePublicPost={refresh}
    />
  );
}
