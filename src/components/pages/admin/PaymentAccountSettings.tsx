import React, { useCallback, useEffect, useState } from 'react';
import Modal from '../../common/Modal';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import { paymentAccountService } from '../../../services/paymentService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { type PaymentAccount } from '../../../types/payment';
import { useConfirm } from '../../../contexts/ConfirmContext';

const EMPTY: PaymentAccount = {
  bankName: '', accountTitle: '', accountNumber: '', iban: '',
  instructions: '', currency: 'PKR', isActive: true,
};

// Admin management of the bank details agents are shown in the payment modal.
// Kept out of the frontend as data so the account can be changed without a
// code change or redeploy.
const PaymentAccountSettings: React.FC = () => {
  const confirm = useConfirm();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState<PaymentAccount>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentAccountService.list();
      setAccounts(response.data || []);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const openCreate = () => { setEditing(EMPTY); setForm(EMPTY); setErrors({}); };
  const openEdit = (account: PaymentAccount) => {
    setEditing(account);
    setForm({ ...account, iban: account.iban || '', instructions: account.instructions || '' });
    setErrors({});
  };

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: '' } : previous));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editing?._id) await paymentAccountService.update(editing._id, form);
      else await paymentAccountService.create(form);
      showToast.success(editing?._id ? 'Payment account updated' : 'Payment account added');
      setEditing(null);
      fetchAccounts();
    } catch (error) {
      const parsed = extractApiError(error);
      setErrors(parsed.errors || {});
      showToast.error(parsed.errors ? 'Please fix the highlighted fields' : parsed.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (account: PaymentAccount) => {
    if (!account._id) return;
    const ok = await confirm({
      title: 'Delete Payment Account',
      subtitle: account.bankName,
      heading: 'Remove These Bank Details',
      description: 'Agents will no longer see this account. You can only delete an inactive account — activate another one first if this is the active set of details.',
      icon: 'error',
      actionColor: 'danger',
      actionLabel: 'Delete Account',
      dangerZone: true,
    });
    if (!ok) return;
    try {
      await paymentAccountService.remove(account._id);
      showToast.success('Payment account deleted');
      fetchAccounts();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    }
  };

  const activate = async (account: PaymentAccount) => {
    if (!account._id) return;
    try {
      await paymentAccountService.update(account._id, { ...account, isActive: true });
      showToast.success(`${account.bankName} is now the active payment account`);
      fetchAccounts();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    }
  };

  const field = (
    name: keyof PaymentAccount, label: string, required = false,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div className="mb-20">
      <label htmlFor={`pa-${name}`} className="form-label fw-semibold">
        {label}{required && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        id={`pa-${name}`}
        name={name}
        className={`form-control${errors[name] ? ' is-invalid' : ''}`}
        value={(form[name] as string) || ''}
        onChange={change}
        disabled={saving}
        {...props}
      />
      {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );

  return (
    <div className="dashboard-card">
      <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h4 className="mb-0">Payment Account</h4>
        <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
          <i className="fas fa-plus me-2" aria-hidden="true" />Add account
        </button>
      </div>
      <div className="card-body">
        <p className="text-muted">
          These are the bank details agents see when paying for a plan. Exactly one account is active at a
          time — activating another switches it over immediately, with no redeploy.
        </p>

        {loading ? (
          <TableSkeleton rows={2} columns={5} />
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-university" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No payment account configured</h5>
            <p className="text-muted">
              Agents can&apos;t pay for a plan until you add one — the payment modal will tell them to contact
              support instead of showing an empty form.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th scope="col">Bank</th>
                  <th scope="col">Account title</th>
                  <th scope="col">Account number</th>
                  <th scope="col">IBAN</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account._id}>
                    <td>{account.bankName}</td>
                    <td>{account.accountTitle}</td>
                    <td><code className="small">{account.accountNumber}</code></td>
                    <td><code className="small">{account.iban || '—'}</code></td>
                    <td>
                      {account.isActive
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-secondary">Inactive</span>}
                    </td>
                    <td className="text-end">
                      {!account.isActive && (
                        <button
                          type="button" className="btn btn-sm btn-outline-success me-2"
                          onClick={() => activate(account)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button" className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEdit(account)}
                      >
                        Edit
                      </button>
                      <button
                        type="button" className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(account)}
                        disabled={account.isActive}
                        title={account.isActive ? 'Activate another account before deleting this one' : 'Delete'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing._id ? 'Edit payment account' : 'Add payment account'}
          size="md"
          busy={saving}
          onSubmit={save}
          footer={(
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save account'}
              </button>
            </>
          )}
        >
          {field('bankName', 'Bank name', true, { placeholder: 'e.g. Meezan Bank' })}
          {field('accountTitle', 'Account title', true, { placeholder: 'Account holder name' })}
          {field('accountNumber', 'Account number', true, { placeholder: '01234567890123' })}
          {field('iban', 'IBAN', false, { placeholder: 'PK36SCBL0000001123456702' })}
          {field('currency', 'Currency', true, { placeholder: 'PKR', maxLength: 3 })}

          <div className="mb-20">
            <label htmlFor="pa-instructions" className="form-label fw-semibold">Payment instructions</label>
            <textarea
              id="pa-instructions"
              name="instructions"
              rows={3}
              className={`form-control${errors.instructions ? ' is-invalid' : ''}`}
              value={form.instructions || ''}
              onChange={change}
              disabled={saving}
              placeholder="Anything the agent should know — reference format, processing times, etc."
            />
            {errors.instructions && <div className="invalid-feedback">{errors.instructions}</div>}
          </div>

          <div className="form-check">
            <input
              id="pa-isActive"
              name="isActive"
              type="checkbox"
              className="form-check-input"
              checked={!!form.isActive}
              onChange={change}
              disabled={saving}
            />
            <label htmlFor="pa-isActive" className="form-check-label">
              Make this the active account
              <small className="d-block text-muted">Any other active account is switched off.</small>
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentAccountSettings;
