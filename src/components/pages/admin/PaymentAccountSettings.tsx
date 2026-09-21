import React, { useCallback, useEffect, useState } from 'react';
import Modal from '../../common/Modal';
import { Badge, Button, DataTable, IconButton, type DataTableColumn } from '../../ui';
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

  const columns: DataTableColumn<PaymentAccount>[] = [
    { key: 'bank', header: 'Bank', render: (a) => <span className="fw-semibold">{a.bankName}</span> },
    { key: 'title', header: 'Account title', hideBelow: 'md', render: (a) => a.accountTitle },
    {
      key: 'number',
      header: 'Account number',
      nowrap: true,
      render: (a) => <code className="small">{a.accountNumber}</code>,
    },
    {
      key: 'iban',
      header: 'IBAN',
      nowrap: true,
      hideBelow: 'lg',
      render: (a) => <code className="small">{a.iban || '—'}</code>,
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (a) => (a.isActive
        ? <Badge tone="success" dot>Active</Badge>
        : <Badge tone="neutral" dot>Inactive</Badge>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '132px',
      render: (account) => (
        <div className="ui-actions">
          {!account.isActive && (
            <IconButton
              icon="far fa-circle-check"
              label="Make this the active account"
              tone="success"
              onClick={() => activate(account)}
            />
          )}
          <IconButton
            icon="far fa-pen-to-square"
            label="Edit"
            onClick={() => openEdit(account)}
          />
          <IconButton
            icon="far fa-trash-can"
            label={account.isActive ? 'Activate another account before deleting this one' : 'Delete'}
            tone="danger"
            onClick={() => remove(account)}
            disabled={account.isActive}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="card-body">
        <p className="text-muted">
          These are the bank details agents see when paying for a plan. Exactly one account is active at a
          time — activating another switches it over immediately, with no redeploy.
        </p>

        <DataTable<PaymentAccount>
          columns={columns}
          rows={accounts}
          rowKey={(account, index) => account._id || `new-${index}`}
          pagination={{ noun: 'accounts' }}
          title="Payment Account"
          loading={loading}
          search={{ placeholder: 'Search by bank or account title…', keys: ['bankName', 'accountTitle'] }}
          actions={<Button icon="fas fa-plus" size="sm" onClick={openCreate}>Add account</Button>}
          emptyState={{
            icon: 'fas fa-university',
            title: 'No payment account configured',
            description: "Agents can't pay for a plan until you add one — the payment modal will tell them to contact support instead of showing an empty form.",
            action: <Button onClick={openCreate}>Add account</Button>,
          }}
        />
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
