'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDay()}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);

        this.cadence = cadence;
        this._setDescription();
        this.clacPace();
    }

    clacPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);

        this.elevation = elevation;
        this._setDescription();
        this.calcSpeed();
    }

    calcSpeed() {
        this.speed = this.duration / (this.distance / 60);
        return this.speed;
    }
}

class App {
    #workouts = [];
    #map;
    #mapEvent;

    constructor() {
        this._getPosition();
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField.bind(this));
        containerWorkouts.addEventListener('click', this._goToMark.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function() {
                    alert('uhh...');
                },
            );
        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(item => this._renderWorkoutMarker(item));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();
        const isInputValid = (...inputs) =>
            inputs.every(input => Number.isFinite(input));

        const isInputPositive = (...inputs) => inputs.every(item => item > 0);
        //get the data
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //check if the data in valid

        //if activity is running ,create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (
                !isInputValid(distance, duration, cadence) ||
                !isInputPositive(duration, distance)
            )
                return alert('wtf?');
            workout = new Running([lat, lng], distance, duration, cadence);
            this.#workouts.push(workout);

            this._renderWorkoutMarker(workout);
            this._renderWorkout(workout);

            inputDistance.value = inputElevation.value = inputDuration.value = '';
            form.classList.add('hidden');
        }

        //if activity is cycling ,create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            if (
                !isInputValid(duration, distance, elevation) ||
                !isInputPositive(duration, distance)
            )
                return alert('wtf?');

            workout = new Cycling([lat, lng], distance, duration, elevation);
            this.#workouts.push(workout);

            this._renderWorkoutMarker(workout);
            this._renderWorkout(workout);

            this._setLocalStorage();

            inputDistance.value = inputCadence.value = inputDuration.value = '';
            form.classList.add('hidden');
        }
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 200,
                    minWidth: 50,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                }),
            )
            .setPopupContent(workout.type)
            .openPopup();
    }
    _renderWorkout(workout) {
        let workoutElement = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'cycling' ? '🚴' : '🏃'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
      `;

        if (workout.type === 'running') {
            workoutElement += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div> 
          </li>
        `;
        }

        if (workout.type === 'cycling') {
            workoutElement += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevation}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>
        `;
        }
        form.insertAdjacentHTML('afterend', workoutElement);
    }
    _goToMark(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;
        const tag = this.#workouts.find(item => item.id === workoutEl.dataset.id);
        this.#map.setView(tag.coords, 13);
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);
        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach(item => {
            this._renderWorkout(item);
        });
    }
}
const app = new App();
