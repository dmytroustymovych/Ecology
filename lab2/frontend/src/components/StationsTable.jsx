import React, { useState, useEffect } from 'react';
import { Table, Alert, Spinner, Badge, Form, Button, Modal, Row, Col } from 'react-bootstrap';
import apiService from '../services/api';

function StationsTable() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(100);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    station_id: '',
    city_name: '',
    station_name: '',
    local_name: '',
    timezone: '+0300',
    latitude: '',
    longitude: '',
    platform_name: 'SaveEcoBot',
    measured_parameters: ''
  });

  useEffect(() => {
    fetchStations(limit);
  }, [limit]);

  const fetchStations = async (selectedLimit) => {
    try {
      setLoading(true);
      const params = { limit: selectedLimit === 'all' ? 'all' : Number(selectedLimit) };
      const response = await apiService.getStations(params);
      setStations(response.data || []);
      setError(null);
    } catch (err) {
      setError('Помилка завантаження станцій: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setFormError('');
    setModalMode('add');
    setFormData({
      station_id: '',
      city_name: '',
      station_name: '',
      local_name: '',
      timezone: '+0300',
      latitude: '',
      longitude: '',
      platform_name: 'SaveEcoBot',
      measured_parameters: ''
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) {
      alert('Виберіть рівно одну станцію для редагування.');
      return;
    }
    const selected = stations.find((s) => s.station_id === selectedIds[0]);
    if (!selected) {
      alert('Не вдалося знайти вибрану станцію.');
      return;
    }
    setFormError('');
    setModalMode('edit');
    setFormData({
      station_id: selected.station_id || '',
      city_name: selected.city_name || '',
      station_name: selected.station_name || '',
      local_name: selected.local_name || '',
      timezone: selected.timezone || '+0300',
      latitude: selected.location?.coordinates?.[1] ?? '',
      longitude: selected.location?.coordinates?.[0] ?? '',
      platform_name: selected.platform_name || 'SaveEcoBot',
      measured_parameters: (selected.measured_parameters || []).join(', ')
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const measuredParams = (formData.measured_parameters || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      station_id: (formData.station_id || '').trim(),
      city_name: (formData.city_name || '').trim(),
      station_name: (formData.station_name || '').trim(),
      local_name: formData.local_name?.trim() || undefined,
      timezone: formData.timezone || '+0300',
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      platform_name: formData.platform_name?.trim() || undefined,
      measured_parameters: measuredParams.length ? measuredParams : undefined
    };

    if (!payload.station_id || !payload.city_name || !payload.station_name || isNaN(payload.latitude) || isNaN(payload.longitude)) {
      throw new Error('Заповніть обов\'язкові поля та коректні координати.');
    }
    return payload;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setFormError('');
      const payload = buildPayload();

      if (modalMode === 'add') {
        await apiService.createStation(payload);
      } else {
        await apiService.updateStation(payload.station_id, payload);
      }

      setShowModal(false);
      await fetchStations(limit);
      setSelectedIds([]);
    } catch (err) {
      setFormError(err.message || 'Помилка збереження станції');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Виберіть хоча б одну станцію для видалення.');
      return;
    }
    if (!window.confirm('Зробити вибрані станції inactive?')) return;
    try {
      setSaving(true);
      for (const id of selectedIds) {
        await apiService.deleteStation(id);
      }
      await fetchStations(limit);
      setSelectedIds([]);
    } catch (err) {
      alert('Помилка видалення: ' + (err.message || '')); 
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Завантаження...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <div>
          <Form.Label className="me-2 mb-0 fw-semibold">Показати:</Form.Label>
          <Form.Select
            size="sm"
            value={limit}
            onChange={(e) => setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ width: '160px', display: 'inline-block' }}
          >
            <option value={1}>1</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value="all">Всі</option>
          </Form.Select>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="primary" size="sm" onClick={openAddModal}>
            Додати станцію
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={openEditModal}>
            Редагувати станцію
          </Button>
          <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={saving}>
            Видалити станцію
          </Button>
        </div>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th style={{ width: '48px' }}></th>
            <th>ID станції</th>
            <th>Місто</th>
            <th>Назва станції</th>
            <th>Статус</th>
            <th>Координати</th>
            <th>Параметри</th>
            <th>Останнє вимірювання</th>
          </tr>
        </thead>
        <tbody>
          {stations.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">
                Станції не знайдені
              </td>
            </tr>
          ) : (
            stations.map((station) => {
              const isSelected = selectedIds.includes(station.station_id);
              return (
                <tr
                  key={`station-${station.station_id}-${station.city_name}`} // унікальний ключ для кожного рядка таблиці
                  className={isSelected ? 'table-active' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleSelect(station.station_id)}
                >
                  <td className="text-center align-middle">
                    <span
                      className={`select-circle ${isSelected ? 'selected' : ''}`}
                      style={{
                        color: '#d63384',
                        backgroundColor: isSelected ? '#d63384' : 'transparent'
                      }}
                      aria-label={isSelected ? 'Вибрано' : 'Не вибрано'}
                    />
                  </td>
                <td>
                  <code>{station.station_id}</code>
                </td>
                <td>{station.city_name}</td>
                <td>{station.station_name}</td>
                <td>{getStatusBadge(station.status)}</td>
                <td>
                  <small>
                    {station.location?.coordinates?.[1]?.toFixed(4)}, 
                    {station.location?.coordinates?.[0]?.toFixed(4)}
                  </small>
                </td>
                <td>
                  <small>
                    {station.measured_parameters?.join(', ') || 'Не вказано'}
                  </small>
                </td>
                <td>
                  <small>
                    {station.metadata?.last_measurement 
                      ? new Date(station.metadata.last_measurement).toLocaleString('uk-UA')
                      : 'Немає даних'
                    }
                  </small>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
      
      {stations.length > 0 && (
        <div className="mt-2">
          <small className="text-muted">
            {limit === 'all'
              ? `Показано ${stations.length} станцій`
              : `Показано ${stations.length} станцій (ліміт: ${limit})`}
          </small>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Додати станцію' : 'Редагувати станцію'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="stationId">
                <Form.Label>ID станції *</Form.Label>
                <Form.Control
                  name="station_id"
                  value={formData.station_id}
                  onChange={handleFormChange}
                  disabled={modalMode === 'edit'}
                  placeholder="SAVEDNIPRO_12345"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="cityName">
                <Form.Label>Місто *</Form.Label>
                <Form.Control
                  name="city_name"
                  value={formData.city_name}
                  onChange={handleFormChange}
                  placeholder="Kyiv"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="stationName">
                <Form.Label>Назва станції *</Form.Label>
                <Form.Control
                  name="station_name"
                  value={formData.station_name}
                  onChange={handleFormChange}
                  placeholder="Street Shevchenka, 10"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="localName">
                <Form.Label>Локальна назва</Form.Label>
                <Form.Control
                  name="local_name"
                  value={formData.local_name}
                  onChange={handleFormChange}
                  placeholder="Локальна назва"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="timezone">
                <Form.Label>Часовий пояс</Form.Label>
                <Form.Control
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleFormChange}
                  placeholder="+0300"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="latitude">
                <Form.Label>Latitude *</Form.Label>
                <Form.Control
                  name="latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  placeholder="48.45"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="longitude">
                <Form.Label>Longitude *</Form.Label>
                <Form.Control
                  name="longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  placeholder="35.05"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="platform">
                <Form.Label>Платформа</Form.Label>
                <Form.Control
                  name="platform_name"
                  value={formData.platform_name}
                  onChange={handleFormChange}
                  placeholder="SaveEcoBot"
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="parameters">
                <Form.Label>Параметри (через кому)</Form.Label>
                <Form.Control
                  name="measured_parameters"
                  value={formData.measured_parameters}
                  onChange={handleFormChange}
                  placeholder="PM2.5, PM10, Temperature"
                />
                <Form.Text className="text-muted">
                  Доступні: PM2.5, PM10, Temperature, Humidity, Pressure, Air Quality Index, NO2, SO2, CO, O3
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Скасувати
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default StationsTable;
// Коментарі до коду:
// Імпортуємо необхідні бібліотеки та компоненти.
// Функціональний компонент StationsTable відповідає за відображення таблиці станцій.
// Використовуємо хуки useState та useEffect для управління станом та побічними ефектами.
// Функція fetchStations отримує дані про станції з API і оновлює стан компонента.
// Функція getStatusBadge повертає відповідний бейдж для статусу станції.
// Відображаємо індикатор завантаження, повідомлення про помилку або таблицю з даними залежно від стану.
// Експортуємо компонент StationsTable для використання в інших частинах додатку.