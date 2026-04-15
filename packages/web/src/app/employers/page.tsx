import MatcherClient from '../jobs/MatcherClient';

export const metadata = {
  title: 'Employers — REENTRY',
  description: 'Conviction-aware search for fair-chance employers.',
};

export default function EmployersPage() {
  return <MatcherClient />;
}
