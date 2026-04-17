import Sidebar from './Sidebar';

const MainLayout = ({ children, activePage, setActivePage }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;