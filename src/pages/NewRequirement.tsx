import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeading from '../components/ui/PageHeading';
import SectionHeader from '../components/ui/SectionHeader';
import FormField from '../components/ui/FormField';

import {
  materialOptions,
  loadingCountryOptions,
  loadingPortOptions,
  dischargePortOptions,
  preferredBerthOptions,
  contractPreferenceOptions,
  riskPreferenceOptions,
  planningPeriodOptions,
} from '../data/mockData';
import type { NewRequirementForm } from '../types';
import { evaluateRequirement } from '../services/evaluationEngine';

const DRAFT_KEY = 'sagarmanthan:draft';
const CURRENT_EVALUATION_KEY = 'sagarmanthan:current-evaluation';

const defaultForm: NewRequirementForm = {
  material: '',
  quantity: '',
  tolerance: '',
  consignments: '',
  loadingCountry: '',
  loadingPort: '',
  dischargePort: '',
  preferredBerth: '',
  requiredArrivalDate: '',
  planningPeriod: '',
  monthlyRequirement: '',
  contractPreference: '',
  riskPreference: '',
};

export default function NewRequirement() {
  const navigate = useNavigate();
  const [form, setForm] = useState<NewRequirementForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof NewRequirementForm, string>>>({});
  const [savedDraft, setSavedDraft] = useState(false);

  const portOptions = form.loadingCountry
    ? loadingPortOptions[form.loadingCountry] ?? []
    : [];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof NewRequirementForm]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
    // Reset port when country changes
    if (id === 'loadingCountry') {
      setForm((prev) => ({ ...prev, loadingCountry: value, loadingPort: '' }));
    }
    setSavedDraft(false);
  }

  function validate(): boolean {
    const required: (keyof NewRequirementForm)[] = [
      'material', 'quantity', 'loadingCountry', 'loadingPort',
      'dischargePort', 'requiredArrivalDate', 'planningPeriod',
      'contractPreference', 'riskPreference',
    ];
    const newErrors: typeof errors = {};
    required.forEach((field) => {
      if (!form[field]) newErrors[field] = 'This field is required.';
    });
    const quantity = Number(form.quantity);
    if (form.quantity && (!Number.isFinite(quantity) || quantity < 1000)) {
      newErrors.quantity = 'Enter a quantity of at least 1,000 MT.';
    }
    if (form.tolerance && (Number(form.tolerance) < 0 || Number(form.tolerance) > 15)) {
      newErrors.tolerance = 'Tolerance must be between 0% and 15%.';
    }
    if (form.consignments && Number(form.consignments) < 1) {
      newErrors.consignments = 'At least one consignment is required.';
    }
    if (form.monthlyRequirement && Number(form.monthlyRequirement) < 0) {
      newErrors.monthlyRequirement = 'Monthly requirement cannot be negative.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      const result = evaluateRequirement(form);
      sessionStorage.setItem(CURRENT_EVALUATION_KEY, JSON.stringify(result));
      navigate(`/recommendation/${result.reference}`);
    }
  }

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setSavedDraft(true);
  }

  const btnPrimary =
    'rounded border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1d4e7a] focus:outline-none focus:ring-2 focus:ring-primary/50';
  const btnSecondary =
    'rounded border border-border-base bg-white px-4 py-1.5 text-sm font-medium text-text-main hover:bg-bg-page focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="max-w-3xl">
      <PageHeading
        title="Create Freight Requirement"
        description="Enter cargo and delivery details for preliminary charter evaluation."
      />

      <form onSubmit={handleSubmit} noValidate>
        {/* Section A — Cargo Details */}
        <div className="mb-5 rounded border border-border-base bg-white">
          <div className="border-b border-border-base px-4 py-2.5">
            <SectionHeader title="A. Cargo Details" />
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <FormField
              id="material"
              as="select"
              label="Material"
              required
              value={form.material}
              onChange={handleChange}
              error={errors.material}
            >
              <option value="">Select material</option>
              {materialOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="quantity"
              label="Quantity (MT)"
              required
              type="number"
              placeholder="e.g. 80000"
              min={1000}
              value={form.quantity}
              onChange={handleChange}
              error={errors.quantity}
            />

            <FormField
              id="tolerance"
              label="Quantity Tolerance (%)"
              type="number"
              placeholder="e.g. 5"
              min={0}
              max={15}
              value={form.tolerance}
              onChange={handleChange}
              hint="Acceptable deviation above / below nominated quantity."
            />

            <FormField
              id="consignments"
              label="Number of Consignments"
              type="number"
              placeholder="e.g. 1"
              min={1}
              value={form.consignments}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Section B — Route Details */}
        <div className="mb-5 rounded border border-border-base bg-white">
          <div className="border-b border-border-base px-4 py-2.5">
            <SectionHeader title="B. Route Details" />
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <FormField
              id="loadingCountry"
              as="select"
              label="Loading Country"
              required
              value={form.loadingCountry}
              onChange={handleChange}
              error={errors.loadingCountry}
            >
              <option value="">Select country</option>
              {loadingCountryOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="loadingPort"
              as="select"
              label="Loading Port"
              required
              value={form.loadingPort}
              onChange={handleChange}
              error={errors.loadingPort}
            >
              <option value="">
                {form.loadingCountry ? 'Select port' : 'Select country first'}
              </option>
              {portOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="dischargePort"
              as="select"
              label="Discharge Port"
              required
              value={form.dischargePort}
              onChange={handleChange}
              error={errors.dischargePort}
            >
              <option value="">Select port</option>
              {dischargePortOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="preferredBerth"
              as="select"
              label="Preferred Berth"
              value={form.preferredBerth}
              onChange={handleChange}
            >
              <option value="">Any available</option>
              {preferredBerthOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="requiredArrivalDate"
              label="Required Arrival Date"
              required
              type="date"
              value={form.requiredArrivalDate}
              onChange={handleChange}
              error={errors.requiredArrivalDate}
              className="sm:col-span-2"
            />
          </div>
        </div>

        {/* Section C — Planning Details */}
        <div className="mb-5 rounded border border-border-base bg-white">
          <div className="border-b border-border-base px-4 py-2.5">
            <SectionHeader title="C. Planning Details" />
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <FormField
              id="planningPeriod"
              as="select"
              label="Planning Period"
              required
              value={form.planningPeriod}
              onChange={handleChange}
              error={errors.planningPeriod}
            >
              <option value="">Select period</option>
              {planningPeriodOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="monthlyRequirement"
              label="Monthly Requirement (MT)"
              type="number"
              placeholder="e.g. 20000"
              min={0}
              value={form.monthlyRequirement}
              onChange={handleChange}
              hint="Indicative monthly volume for the selected period."
            />

            <FormField
              id="contractPreference"
              as="select"
              label="Contract Preference"
              required
              value={form.contractPreference}
              onChange={handleChange}
              error={errors.contractPreference}
            >
              <option value="">Select preference</option>
              {contractPreferenceOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>

            <FormField
              id="riskPreference"
              as="select"
              label="Risk Preference"
              required
              value={form.riskPreference}
              onChange={handleChange}
              error={errors.riskPreference}
            >
              <option value="">Select preference</option>
              {riskPreferenceOptions.map((o) => <option key={o}>{o}</option>)}
            </FormField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={btnPrimary}>
            Evaluate Requirement
          </button>
          <button type="button" className={btnSecondary} onClick={handleSaveDraft}>
            Save as Draft
          </button>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          {savedDraft && (
            <span className="text-xs text-success font-medium">
              Draft saved successfully.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
