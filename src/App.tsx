import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Overview from './pages/Overview';
import NewRequirement from './pages/NewRequirement';
import FinalRecommendation from './pages/FinalRecommendation';
import { FreightTrends, VesselEvaluationPage, PortBerthData, VoyageCost, ContractPlanning, AssumptionTesting, RiskRegister, PreviousEvaluations } from './pages/OperationalPages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="new-requirement" element={<NewRequirement />} />
          <Route path="recommendation/:id" element={<FinalRecommendation />} />
          <Route path="freight-trends" element={<FreightTrends />} />
          <Route path="vessel-evaluation" element={<VesselEvaluationPage />} />
          <Route path="port-berth-data" element={<PortBerthData />} />
          <Route path="voyage-cost" element={<VoyageCost />} />
          <Route path="contract-planning" element={<ContractPlanning />} />
          <Route path="assumption-testing" element={<AssumptionTesting />} />
          <Route path="risk-register" element={<RiskRegister />} />
          <Route path="previous-evaluations" element={<PreviousEvaluations />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
