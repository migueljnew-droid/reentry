import CaseloadLiveDashboard from '../case-manager/CaseloadLiveDashboard';

export const metadata = {
  title: 'Caseload — REENTRY',
  description: 'Live caseload view for parole/probation officers.',
};

export default function CaseloadPage() {
  return <CaseloadLiveDashboard />;
}
