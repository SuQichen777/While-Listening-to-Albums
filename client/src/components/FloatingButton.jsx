import { useNavigate } from 'react-router-dom';

// the round black button in the corner: write a new blog
function FloatingButton() {
  const navigate = useNavigate();

  return (
    <button type="button" className="c-round-button" onClick={() => navigate('/blog/new')} aria-label="Write a new blog">
      Write
    </button>
  );
}

export default FloatingButton;
