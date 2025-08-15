import { Page, Card, DataTable, Button, Text, Spinner, ButtonGroup, Modal } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  // State for badges, loading, and error
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalActive, setModalActive] = useState(false);
  const [deleteBadgeId, setDeleteBadgeId] = useState(null);
  const [deleteBadgeName, setDeleteBadgeName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Show toast message
  const showToastMessage = (message, isError) => {
    if (shopify?.toast?.show) {
      shopify.toast.show(message, {
        duration: 3000,
        isError: isError,
      });
    } else {
      console.warn("Shopify toast not available:", message);
      alert(message);
    }
  };

  // Fetch badges from API
  const fetchBadges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!shopify?.config?.shop || !shopify?.config?.host) {
        throw new Error("Shopify configuration is missing");
      }

      const response = await fetch(
        `/api/getBadges?shop=${encodeURIComponent(
          shopify.config.shop
        )}&host=${encodeURIComponent(shopify.config.host)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch badges');
      }

      const data = await response.json();
      setBadges(data.badges || []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching badges');
    } finally {
      setIsLoading(false);
    }
  }, [shopify]);

  // Fetch badges on component mount
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Navigate to configuration page
  const handleConfigure = () => {
    navigate('/createBadge');
  };

  // Navigate to edit badge page
  const handleEdit = (badgeId) => {
    console.log("Navigating to:", `/editBadge/${badgeId}`);
    navigate(`/editBadge/${badgeId}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (badgeId, timerName) => {
    setDeleteBadgeId(badgeId);
    setDeleteBadgeName(timerName);
    setModalActive(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setModalActive(false);
    setDeleteBadgeId(null);
    setDeleteBadgeName('');
  };

  // Handle delete badge
  const handleDelete = async () => {
    if (!deleteBadgeId) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(
        `/api/deleteBadge/${deleteBadgeId}?shop=${encodeURIComponent(
          shopify.config.shop
        )}&host=${encodeURIComponent(shopify.config.host)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete badge');
      }

      const result = await response.json();
      showToastMessage(result.message || t('HomePage.deleteSuccess', { defaultValue: 'Timer badge deleted successfully!' }), false);
      
      // Update badges list
      setBadges((prev) => prev.filter((badge) => badge._id !== deleteBadgeId));
      closeDeleteModal();
    } catch (error) {
      showToastMessage(error.message || t('HomePage.deleteError', { defaultValue: 'Failed to delete badge' }), true);
      console.error("Error deleting badge:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table rows for DataTable
  const rows = badges.map((badge) => {
    // Combine endDate and endTime (if endTime is provided)
    const endDateTime = badge.endTime
      ? new Date(`${badge.endDate}T${badge.endTime}`).toLocaleString()
      : new Date(badge.endDate).toLocaleString();
    // Format startDate
    const startDateTime = new Date(badge.startDate).toLocaleString();

    return [
      badge.timerName,
      startDateTime,
      endDateTime,
      badge.color,
      'hsb(0, 0%, 0%)', // Default text_color
      <ButtonGroup>
        <Button size="slim" onClick={() => handleEdit(badge._id)}>
          {t('HomePage.table.edit', { defaultValue: 'Edit' })}
        </Button>
        <Button
          size="slim"
          variant="primary"
          tone="critical"
          onClick={() => openDeleteModal(badge._id, badge.timerName)}
        >
          {t('HomePage.table.delete', { defaultValue: 'Delete' })}
        </Button>
      </ButtonGroup>,
    ];
  });

  return (
    <Page title={t('HomePage.title', { defaultValue: 'Timer Badge Dashboard' })}>
      <TitleBar title={t('HomePage.title', { defaultValue: 'Timer Badge Dashboard' })} />
      <Card>
        <div style={{ padding: '16px' }}>
          <Text as="h2" variant="headingMd">
            {t('HomePage.heading', { defaultValue: 'Manage Your Timer Badges' })}
          </Text>
          <div style={{ margin: '16px 0' }}>
            <Button variant="primary" onClick={handleConfigure}>
              {t('HomePage.configureButton', { defaultValue: 'Configure Timer Badge' })}
            </Button>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Spinner accessibilityLabel="Loading badges" size="large" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Text tone="critical">{error}</Text>
              <Button onClick={fetchBadges}>
                {t('HomePage.retryButton', { defaultValue: 'Retry' })}
              </Button>
            </div>
          ) : badges.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={[
                t('HomePage.table.message', { defaultValue: 'Message' }),
                t('HomePage.table.startTime', { defaultValue: 'Start Time' }),
                t('HomePage.table.endTime', { defaultValue: 'End Time' }),
                t('HomePage.table.backgroundColor', { defaultValue: 'Background Color' }),
                t('HomePage.table.textColor', { defaultValue: 'Text Color' }),
                t('HomePage.table.actions', { defaultValue: 'Actions' }),
              ]}
              rows={rows}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Text>{t('HomePage.noBadges', { defaultValue: 'No timer badges configured yet.' })}</Text>
              <Button variant="primary" onClick={handleConfigure}>
                {t('HomePage.createBadge', { defaultValue: 'Create a Timer Badge' })}
              </Button>
            </div>
          )}
        </div>
      </Card>
      <Modal
        open={modalActive}
        onClose={closeDeleteModal}
        title={t('HomePage.deleteModal.title', { defaultValue: 'Delete Timer Badge' })}
        primaryAction={{
          content: deleteLoading ? <Spinner size="small" /> : t('HomePage.deleteModal.confirm', { defaultValue: 'Delete' }),
          destructive: true,
          onAction: handleDelete,
          disabled: deleteLoading,
        }}
        secondaryActions={[
          {
            content: t('HomePage.deleteModal.cancel', { defaultValue: 'Cancel' }),
            onAction: closeDeleteModal,
          },
        ]}
      >
        <Modal.Section>
          <Text>
            {t('HomePage.deleteModal.message', {
              defaultValue: `Are you sure you want to delete the timer badge "${deleteBadgeName}"? This action cannot be undone.`,
              timerName: deleteBadgeName,
            })}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}