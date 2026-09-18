import { useNavigate } from 'react-router-dom';

function FloatingButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/blog/new');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    </button>
  );
}

export default FloatingButton;
