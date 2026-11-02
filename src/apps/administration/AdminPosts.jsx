import { invalidatePublicData } from '../../services/publicDataService';
import NotesManagement from '../notes/NotesManagement';

/* === Administração de publicações === */
/* ----- Invalidação do conteúdo público ----- */
function refreshPublicPosts() {
  invalidatePublicData('/api/posts');
}

/* === Componente administrativo === */
export default function AdminPosts({ instanceId, authorized }) {
  return (
    <div className="notes-app">
      <NotesManagement
        instanceId={instanceId}
        isAdmin={authorized}
        refreshPublicPosts={refreshPublicPosts}
        onDeletePublicPost={() => {}}
      />
    </div>
  );
}
