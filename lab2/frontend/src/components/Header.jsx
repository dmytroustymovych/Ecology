import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Badge, Button } from 'react-bootstrap';
import apiService from '../services/api';

function Header() { // Компонент шапки сайту
  const [healthStatus, setHealthStatus] = useState('checking');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { // Перевірка стану здоров'я сервера при завантаженні компонента
    checkHealth();
  }, []);

  const checkHealth = async () => { // Функція для перевірки стану здоров'я сервера
    try {
      const health = await apiService.getHealth();
      setHealthStatus(health.success ? 'healthy' : 'unhealthy');
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  const handleSync = async () => { // Функція для синхронізації з SaveEcoBot
    setSyncing(true);
    try {
      await apiService.syncSaveEcoBot();
      alert('Синхронізація завершена!');
      window.location.reload();
    } catch (error) {
      alert('Помилка синхронізації: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Navbar bg="success" variant="dark" expand="lg"> 
      <div className="container">
        <Navbar.Brand href="#home"> 
          Екологічний моніторинг
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#stations">Станції</Nav.Link>
            <Nav.Link href="#measurements">Вимірювання</Nav.Link>
          </Nav>
          <Nav>
            <div className="d-flex align-items-center">
              <Badge 
                bg={healthStatus === 'healthy' ? 'success' : 'danger'}
                className="me-3"
              >
                Сервер: {healthStatus}
              </Badge>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? 'Синхронізація...' : 'Синхронізувати'}
              </Button>
            </div>
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
}

export default Header;
// Коментарі до коду:
// Імпортуємо необхідні бібліотеки та компоненти.
// Використовуємо React Bootstrap для стилізації.
// Використовуємо useState для зберігання стану здоров'я сервера та стану синхронізації.
// Використовуємо useEffect для перевірки здоров'я сервера при завантаженні компонента.
// Функція checkHealth виконує запит до API для перевірки стану сервера.
// Функція handleSync виконує синхронізацію з SaveEcoBot і оновлює сторінку після завершення.
// Відображаємо Navbar з інформацією про стан сервера та кнопкою для синхронізації.
// Експортуємо компонент Header для використання в інших частинах додатку.