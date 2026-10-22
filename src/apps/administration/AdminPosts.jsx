import { invalidatePublicData } from '../../services/publicDataService';
import NotesAdmin from '../notes/NotesAdmin';

/* === Administração de publicações === */
/* ----- Invalidação do conteúdo público ----- */
function refreshPublicPosts() {
  invalidatePublicData('/api/posts');
}

/* === Componente administrativo === */
export default function AdminPosts({ instanceId, authorized }) {
  return (
    <NotesAdmin
      instanceId={instanceId}
      isAdmin={authorized}
      refreshPublicPosts={refreshPublicPosts}
      onDeletePublicPost={() => {}}
    />
  );
}
