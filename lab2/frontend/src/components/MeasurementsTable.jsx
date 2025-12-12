import React, { useState, useEffect } from 'react';
import { Table, Alert, Spinner, Badge, Form, Button, Modal, Row, Col } from 'react-bootstrap';
import apiService from '../services/api';


function MeasurementsTable() { // Компонент таблиці останніх вимірювань
  const [measurements, setMeasurements] = useState([]); // Стан для зберігання вимірювань
  const [loading, setLoading] = useState(true); // Стан для відображення індикатора завантаження
  const [error, setError] = useState(null); // Стан для зберігання помилок
  const [limit, setLimit] = useState(100); // Кількість записів для показу або 'all'
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    station_id: '',
    measurement_time: '',
    pollutants: ''
  });

  useEffect(() => { // Завантаження даних при зміні стану showAll
    fetchMeasurements(limit);
  }, [limit]); //

  const fetchMeasurements = async (selectedLimit) => { // Функція для завантаження вимірювань за вибраним лімітом
    try {
      setLoading(true); // Встановлюємо стан завантаження
      const params = { limit: selectedLimit === 'all' ? 'all' : Number(selectedLimit) };
      const response = await apiService.getMeasurements(params); // Виконуємо запит до API
      setMeasurements(response.data || []); // Оновлюємо стан вимірювань
      setError(null); // Очищаємо помилку
    } catch (err) {
      setError('Помилка завантаження вимірювань: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPollutantBadge = (pollutant, value) => { // Функція для визначення кольору бейджу залежно від рівня забруднення
    // Приклад порогів для різних забруднювачів
    const thresholds = {
      'PM2.5': { warning: 25, danger: 75 },
      'PM10': { warning: 50, danger: 150 },
      'Air Quality Index': { warning: 50, danger: 150 }
    };

    const threshold = thresholds[pollutant]; // Отримуємо пороги для конкретного забруднювача
    if (!threshold) return 'secondary'; // Якщо немає порогів, повертаємо нейтральний колір

    if (value > threshold.danger) return 'danger'; // Якщо перевищує поріг небезпеки
    if (value > threshold.warning) return 'warning'; // Якщо перевищує поріг попередження
    return 'success'; // Якщо все в нормі
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
      measurement_time: '',
      pollutants: ''
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) {
      alert('Виберіть рівно одне вимірювання для редагування.');
      return;
    }
    const selected = measurements.find((m) => m._id === selectedIds[0]);
    if (!selected) {
      alert('Не вдалося знайти вибране вимірювання.');
      return;
    }
    setFormError('');
    setModalMode('edit');
    
    // Format pollutants as JSON string for editing
    const pollutantsStr = JSON.stringify(selected.pollutants || [], null, 2);
    
    setFormData({
      station_id: selected.station_id || '',
      measurement_time: selected.measurement_time ? new Date(selected.measurement_time).toISOString().slice(0, 16) : '',
      pollutants: pollutantsStr
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    let pollutants = [];
    try {
      pollutants = JSON.parse(formData.pollutants || '[]');
      if (!Array.isArray(pollutants)) throw new Error('Pollutants must be an array');
    } catch {
      throw new Error('Невалідний JSON для забруднювачів');
    }

    const payload = {
      station_id: (formData.station_id || '').trim(),
      measurement_time: formData.measurement_time ? new Date(formData.measurement_time).toISOString() : new Date().toISOString(),
      pollutants: pollutants.length ? pollutants : []
    };

    if (!payload.station_id || !pollutants.length) {
      throw new Error('Заповніть ID станції та забруднювачів');
    }
    return payload;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setFormError('');
      const payload = buildPayload();

      if (modalMode === 'add') {
        await apiService.createMeasurement(payload);
      } else {
        await apiService.updateMeasurement(selectedIds[0], payload);
      }

      setShowModal(false);
      await fetchMeasurements(limit);
      setSelectedIds([]);
    } catch (err) {
      setFormError(err.message || 'Помилка збереження вимірювання');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Виберіть хоча б одне вимірювання для видалення.');
      return;
    }
    if (!window.confirm('Видалити вибрані вимірювання?')) return;
    try {
      setSaving(true);
      for (const id of selectedIds) {
        await apiService.deleteMeasurement(id);
      }
      await fetchMeasurements(limit);
      setSelectedIds([]);
    } catch (err) {
      alert('Помилка видалення: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };


  if (loading) { // Відображаємо індикатор завантаження
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Завантаження...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>; // Відображаємо повідомлення про помилку
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
            Додати вимірювання
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={openEditModal}>
            Редагувати вимірювання
          </Button>
          <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={saving}>
            Видалити вимірювання
          </Button>
        </div>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th style={{ width: '48px' }}></th>
            <th>Станція</th>
            <th>Час вимірювання</th>
            <th>Забруднювачі</th>
            <th>Джерело</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((measurement, index) => {
            const isSelected = selectedIds.includes(measurement._id);
            return (
              <tr
                key={`m-${measurement._id || index}`}
                className={isSelected ? 'table-active' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSelect(measurement._id)}
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
                  <code>{measurement.station_id}</code>
                </td>
                <td>
                  <small>
                    {new Date(measurement.measurement_time).toLocaleString('uk-UA')}
                  </small>
                </td>
                <td>
                  <div>
                    {measurement.pollutants?.map((pollutant, idx) => (
                      <Badge 
                        key={`${measurement._id || measurement.station_id}-${pollutant.pollutant}-${idx}`}
                        bg={getPollutantBadge(pollutant.pollutant, pollutant.value)}
                        className="me-1 mb-1"
                      > 
                        {pollutant.pollutant}: {pollutant.value} {pollutant.unit}
                      </Badge>
                    )) || 'Немає даних'}
                  </div> 
                </td>
                <td>
                  <small>{measurement.metadata?.source || 'Невідоме'}</small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      
      {measurements.length > 0 && (
        <div className="mt-2">
          <small className="text-muted">
            {limit === 'all'
              ? `Показано ${measurements.length} записів`
              : `Показано ${measurements.length} записів (ліміт: ${limit})`}
          </small>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Додати вимірювання' : 'Редагувати вимірювання'}</Modal.Title>
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
              <Form.Group controlId="measurementTime">
                <Form.Label>Час вимірювання *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="measurement_time"
                  value={formData.measurement_time}
                  onChange={handleFormChange}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="pollutants">
                <Form.Label>Забруднювачі (JSON) *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="pollutants"
                  value={formData.pollutants}
                  onChange={handleFormChange}
                  placeholder='[{"pollutant": "PM2.5", "value": 25, "unit": "ug/m3", "averaging_period": "2 minutes"}]'
                  style={{ fontFamily: 'monospace' }}
                />
                <Form.Text className="text-muted">
                  Введіть JSON масив з об'єктами забруднювачів. Обов'язкові поля: pollutant, value, unit.
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

export default MeasurementsTable;

// Коментарі до коду:
// Імпортуємо необхідні бібліотеки та компоненти.
// Використовуємо React Bootstrap для стилізації.
// Використовуємо useState для зберігання стану вимірювань, завантаження, помилок та показу всіх/останніх вимірювань.
// Використовуємо useEffect для завантаження даних при зміні стану showAll.
// Функції fetchLatestMeasurements та fetchAllMeasurements виконують запити до API для отримання відповідних даних.
// Функція getPollutantBadge визначає колір бейджу залежно від рівня забруднення.
// Відображаємо таблицю з вимірюваннями або повідомлення про помилку/завантаження.
// Експортуємо компонент MeasurementsTable для використання в інших частинах додатку.