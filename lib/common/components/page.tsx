import { FunctionComponent } from 'preact';
import Sidebar from '../../common/components/sidebar.tsx';

const Page: FunctionComponent<PageProps> = ({ currentRoute, children }) => {
  return (
    <div class='page'>
      <Sidebar currentRoute={currentRoute} />

      <div class='main'>
        <header class='header'>
          <span class='title'>Deno KV Insights</span>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
};

export interface PageProps {
  currentRoute: string;
}

export default Page;
