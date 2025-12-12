// ============================================================================
// HEADER.TEST.JS - навчальні приклади тестів для компонента Header.jsx
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';
import apiService from '../services/api';


// Мок сервісу API
jest.mock('../services/api');
// Група тестів
describe('Header Component Tests', () => {
    // Загальні налаштування перед кожним тестом
  beforeEach(() => {
    window.alert = jest.fn(); //  Мок alert

    apiService.getHealth.mockResolvedValue({ success: true }); // Мок відповіді getHealth
    apiService.syncSaveEcoBot.mockResolvedValue({
      results: {
        stations_created: 5,
        measurements_created: 100
      }
    }); // Мок відповіді syncSaveEcoBot
  });

// Очищення моків після кожного тесту
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  // Базовий тест рендерингу
  test('renders header with title', () => {
    render(<Header />);
    // render(<Component />) → рендерить компонент у віртуальний DOM (jsdom).
    expect(screen.getByText('Екологічний моніторинг')).toBeInTheDocument();
    // screen → API для пошуку елементів у DOM після render().
    //   - getByText('текст') → знайде елемент з текстом, або помилка якщо його нема
    //   - findByText('текст') → асинхронна версія (чекає на появу)
    //   - queryByText('текст') → поверне null, якщо елемента нема (корисно для перевірки відсутності)
    //   - getByRole('button') → знайде елемент за роллю (button, link, textbox тощо)
  });

  // Асинхронний тест (health badge)
  test('displays health status badge', async () => {
    render(<Header />); 
    await waitFor(() => {
      expect(screen.getByText(/Сервер: healthy/i)).toBeInTheDocument();
    }); 
    // waitFor(() => { ... }) → чекає доки умова стане правдивою (для асинхронних операцій).
    // expect(value).matcher → перевірка (assertion).
    //   - toBeInTheDocument() → елемент є в DOM
    //   - toHaveTextContent('текст') → елемент містить текст
    //   - toHaveClass('className') → елемент має CSS клас
    //   - toBeDisabled() → елемент disabled
});

  // Взаємодія (loading state)
  test('sync button shows loading state when clicked', async () => {
    render(<Header />);
    const syncButton = await screen.findByText('Синхронізувати'); // findByText → асинхронно чекає появи елемента
    fireEvent.click(syncButton); 
    // fireEvent → симулює події користувача (click, change, submit, keyDown тощо).
    //   - fireEvent.click(button) → клік по кнопці
    //   - fireEvent.change(input, { target: { value: 'text' } }) → зміна значення input
    //   - fireEvent.submit(form) → сабміт форми
    await waitFor(() => {
    expect(screen.getByText('Синхронізація...')).toBeInTheDocument(); // Чекаємо поки кнопка покаже стан "Синхронізація..."
  });
   });

  // Виклик API
  test('calls syncSaveEcoBot when button clicked', async () => {
    render(<Header />);
    const syncButton = await screen.findByText('Синхронізувати');
    fireEvent.click(syncButton); // Клік по кнопці

    await waitFor(() => {
      expect(apiService.syncSaveEcoBot).toHaveBeenCalled(); // toHaveBeenCalled() → перевіряє що мокована функція була викликана
    });

    expect(window.alert).toHaveBeenCalledWith('Синхронізація завершена!');
  });

  // Обробка помилок
  test('shows unhealthy status when API fails', async () => {
    apiService.getHealth.mockRejectedValue(new Error('Server down'));
    render(<Header />);
    await waitFor(() => {
      expect(screen.getByText(/Сервер: unhealthy/i)).toBeInTheDocument();
    });
  });

  // CSS класи
  test('displays correct badge color for healthy status', async () => {
    render(<Header />);
    await waitFor(() => {
      const badge = screen.getByText(/healthy/i);
      expect(badge).toHaveClass('bg-success');
    });
  });

  // Snapshot
  test('Header matches snapshot', () => {
    const { asFragment } = render(<Header />);
    expect(asFragment()).toMatchSnapshot();
  });

  // Кнопка disabled під час sync
  test('button is disabled during sync', async () => {
    render(<Header />);
    const syncButton = await screen.findByText('Синхронізувати');

    expect(syncButton).not.toBeDisabled();

    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(syncButton).toBeDisabled();
    });
  });
});

// ============================================================================
// КІНЕЦЬ HEADER.TEST.JS
// ============================================================================



// ============================================================================
// ТИПИ ТЕСТІВ (ЗАГАЛЬНИЙ ОГЛЯД)
// ============================================================================
//
// 1. Unit тести
//    - Тестують окремі функції/методи
//    - Швидкі, прості, ізольовані
//
//    test('add function works', () => {
//      expect(add(2, 3)).toBe(5);
//    });
//
// 2. Component тести
//    - Тестують рендеринг React-компонента
//
//    test('Button renders', () => {
//      render(<Button>Click</Button>);
//      expect(screen.getByText('Click')).toBeInTheDocument();
//    });
//
// 3. Integration тести
//    - Перевіряють як декілька компонентів працюють разом
//
//    test('Form submits data', async () => {
//      render(<Form />);
//      fireEvent.click(screen.getByText('Submit'));
//      await waitFor(() => {
//        expect(screen.getByText('Success')).toBeInTheDocument();
//      });
//    });
//
// 4. Snapshot тести
//    - Роблять "знімок" HTML-компонента та порівнюють з попереднім
//
//    test('Component matches snapshot', () => {
//      const { asFragment } = render(<Component />);
//      expect(asFragment()).toMatchSnapshot();
//    });
//
// 5. E2E (end-to-end) тести
//    - Перевіряють повний user flow, зазвичай з Cypress / Playwright
//
//    test('User can login', async () => {
//      // Відкрити сторінку
//      // Ввести логін/пароль
//      // Натиснути кнопку
//      // Перевірити що залогінений
//    });
//
// ============================================================================
// ПІДСУМОК
// - fireEvent → симуляція подій
// - screen → пошук елементів
// - expect → перевірка (assertion)
// - Unit, Component, Integration, Snapshot, E2E → різні рівні тестування
// ============================================================================


// ============================================================================
// КОРИСНІ МАТЧЕРИ jest-dom
// ============================================================================
/*

ТЕКСТ І КОНТЕНТ:
- toBeInTheDocument() - елемент є в DOM
- toHaveTextContent('text') - має текст
- toContainHTML('<span>text</span>') - містить HTML

АТРИБУТИ:
- toHaveAttribute('href', '/home') - має атрибут зі значенням
- toHaveClass('btn', 'btn-primary') - має CSS класи
- toHaveStyle({ color: 'red' }) - має inline стилі

СТАН:
- toBeDisabled() / toBeEnabled() - disabled/enabled
- toBeVisible() / not.toBeVisible() - видимий/невидимий
- toBeChecked() / not.toBeChecked() - checked (checkbox/radio)
- toBeRequired() - required поле

ФОРМИ:
- toHaveValue('text') - значення input
- toHaveDisplayValue('text') - відображуване значення select
- toBeInvalid() / toBeValid() - валідність форми

FOCUS:
- toHaveFocus() - елемент у фокусі

*/

// ============================================================================
// КОРИСНІ ФУНКЦІЇ @testing-library/react
// ============================================================================
/*

ПОШУК ЕЛЕМЕНТІВ:

getBy* - знаходить елемент зразу (помилка якщо не знайдено)
- getByText('text')
- getByRole('button')
- getByLabelText('Email')
- getByPlaceholderText('Enter name')
- getByTestId('custom-element')

queryBy* - знаходить елемент зразу (null якщо не знайдено)
- queryByText('text') - для перевірки що елемента НЕМАЄ
- expect(screen.queryByText('text')).not.toBeInTheDocument()

findBy* - чекає появи елемента (async)
- await screen.findByText('Loading...')

ВАРІАНТИ (множина):
- getAllByText('text') - всі елементи з текстом
- queryAllByText('text')
- findAllByText('text')

ДЕБАГ:
- screen.debug() - показує весь DOM
- screen.debug(element) - показує конкретний елемент
- screen.logTestingPlaygroundURL() - URL для testing playground

*/

// ============================================================================
// FIREEVENT VS USER-EVENT
// ============================================================================
/*

fireEvent - базові браузерні події:
- fireEvent.click(button)
- fireEvent.change(input, { target: { value: 'text' } })
- fireEvent.submit(form)

@testing-library/user-event - більш реалістична симуляція:
- await user.click(button) - симулює hover, mousedown, click
- await user.type(input, 'text') - вводить по символу
- await user.selectOptions(select, 'option1')

Коли використовувати:
- fireEvent - для простих тестів, швидше
- user-event - для складніших сценаріїв, більш реалістично

*/

// ============================================================================
// BEST PRACTICES (НАЙКРАЩІ ПРАКТИКИ)
// ============================================================================
/*

1. Тестуйте поведінку, а не реалізацію
   - Погано: expect(component.state.count).toBe(0)
   - Добре: expect(screen.getByText('Count: 0')).toBeInTheDocument()

2. Використовуйте describe для групування
   - Легше знайти потрібний тест
   - Можна виконати тільки одну групу

3. Пишіть описові назви тестів
   - Погано: test('test1', () => {})
   - Добре: test('shows error message when API fails', () => {})

4. Один тест = одна перевірка
   - Тест має бути простим і зрозумілим
   - Легше знайти що поламалось

5. Використовуйте beforeEach для спільного коду
   - Не дублюйте налаштування
   - Кожен тест починається з чистого стану

6. Очищайте моки після тестів
   - afterEach(() => { jest.clearAllMocks() })
   - Тести не впливають один на одного

7. Тестуйте помилки
   - Користувачі побачать помилки
   - Важливо щоб вони обробляли коректно

8. Використовуйте async/await
   - Простіше читати ніж .then()
   - Не забувайте await перед асинхронними викликами!

*/

// ============================================================================
// КІНЕЦЬ НАВЧАЛЬНОГО ФАЙЛУ
// ============================================================================
