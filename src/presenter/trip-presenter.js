import SortListView from '../view/sort-list-view.js';
import FormCreateEditView from '../view/form-create-edit.js';
import TripNoEventView from '../view/no-point-view.js';
import TripEventListView from '../view/trip-event-list-view.js';
import PointPresenter from './point-presenter.js';

import {render,remove} from '../framework/render.js';
import {BLANK_POINT} from '../model/points-model.js';
import {generateSorter} from '../utils/sort.js';
import {filter} from '../utils/filter.js';

import { nanoid } from 'nanoid';

import {sortDay, sortPrice, sortTime} from '../utils/point.js';
import {SortType,DEFAULT_SORT_TYPE,UserAction,UpdateType} from '../const.js';

export default class TripPresenter {

  // #newTaskPresenter = null;
  //Коллекция презентеров точек маршрута
  #pointPresenters = new Map();


  #tripContainer = null;
  #filterListView = null;
  #tripNoEventView = null;
  #sortListView = null;
  #pointsModel = null;
  #filterModel = null;
  #newEventComponent = null;

  #newPointButton = document.querySelector('.trip-main__event-add-btn');


  //Рабочий массив точек маршрута
  //#tripPoints = [];
  //Исходный немутированный массив точек маршрута
  //  #sourceTripPoints = [];

  //Текущий метод сортировки
  #currentSortType = DEFAULT_SORT_TYPE;

  #filters = [];
  #sorters = [];


  #tripEventListComponent = new TripEventListView();

  constructor({tripContainer,pointsModel,filterModel}) {
    this.#tripContainer = tripContainer;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;


    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);

    this.#newPointButton.addEventListener('click',this.#newEventHandler);


  }

  #handleViewAction = (actionType, updateType, update) => {

    // Здесь будем вызывать обновление модели.
    // actionType - действие пользователя, нужно чтобы понять, какой метод модели вызвать
    // updateType - тип изменений, нужно чтобы понять, что после нужно обновить
    // update - обновленные данные
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointsModel.updateTask(updateType, update);
        break;
      case UserAction.ADD_POINT:
        this.#pointsModel.addTask(updateType, update);

        break;
      case UserAction.DELETE_POINT:
        this.#pointsModel.deleteTask(updateType, update);
        break;
    }
  };

  #handleModelEvent = (updateType, data) => {

    // В зависимости от типа изменений решаем, что делать:
    // - обновить часть списка (например, когда поменялось описание)
    // - обновить список (например, когда задача ушла в архив)
    // - обновить всю доску (например, при переключении фильтра)
    switch (updateType) {
      case UpdateType.SMALL:
        // - обновить часть списка ()
        this.#pointPresenters.get(data.id).init(data);
        break;
      case UpdateType.MIDDLE:
        // - обновить список ()
        this.#clearPointsSection();
        this.#renderTrip();

        break;
      case UpdateType.BIG:
        // - обновить всю доску (например, при переключении фильтра)
        this.#clearPointsSection({resetSort:true});
        this.#renderTrip();

        break;
    }
  };


  init() {
    //Сортировка
    this.#sorters = generateSorter(this.#pointsModel.points);


    render(this.#tripEventListComponent, this.#tripContainer);
    this.#renderTrip();
  }

  //Перерисовать список сортировки
  #renderSorters(){
    this.#sortListView = new SortListView({sorters : this.#sorters,
      onSortClick : this.#sortClickHandler});

    render(this.#sortListView, this.#tripContainer,'afterbegin');
  }


  //обработчик создания новой точки
  #newEventHandler = (evt) =>{
    this.#newPointButton.disabled = true;
    evt.preventDefault();
    if (!this.#newEventComponent){
      this.#newEventComponent = new FormCreateEditView({point:BLANK_POINT,
        onSubmitClick: this.#newEventSubmitHandler,
        onCancelClick: this.#newEventCancelHandler,
        isEditForm : false});
      render(this.#newEventComponent, this.#tripContainer,'afterbegin');

      this.#clearPointsSection({resetSort:true});
      this.#renderTrip();

    }
  };

  //Добавляем точку
  #newEventSubmitHandler = (newpoint)=>{
    this.#newPointButton.disabled = false;

    this.#handleViewAction(
      UserAction.ADD_POINT,
      UpdateType.MIDDLE,
      // Пока у нас нет сервера, который бы после сохранения
      // выдывал честный id задачи, нам нужно позаботиться об этом самим
      {id: nanoid(), ...newpoint},
    );
    remove(this.#newEventComponent);
    this.#newEventComponent = null;

  };

  //Отмена добавления точки или удаление в форме редактирования
  #newEventCancelHandler = ()=>{

    this.#newPointButton.disabled = false;
    remove(this.#newEventComponent);
    this.#newEventComponent = null;

  };


  //Обработчик сортировки
  #sortClickHandler = (sortType) =>{
    if (this.#currentSortType === sortType) {
      return;
    }
    this.#currentSortType = sortType;
    this.#clearPointsSection();
    //Отрисовка
    this.#renderTrip();

  };


  //Очищаем список точек, секции фильтрации и сортировки
  #clearPointsSection({resetSort = false} = {}){
    this.#clearPointPresenters();
    if (resetSort) {
      this.#currentSortType = DEFAULT_SORT_TYPE;
    }
    remove(this.#sortListView);
    remove(this.#filterListView);
    remove(this.#tripNoEventView);
    this.#sortListView = null;
    this.#filterListView = null;
    this.#tripNoEventView = null;

  }


  //Отрисуем к точки маршрутов, если они есть
  #renderTrip() {
    const points = this.points;

    //this.#renderFilters();
    this.#renderSorters();

    if (points.length > 0) {
      this.#renderPoints(points);
    } else {
      this.#renderNoPoint();
    }
  }

  //Заглушка при отсутствии точек
  #renderNoPoint(){
    this.#tripNoEventView = new TripNoEventView({currentFilter: this.#filterModel.filter});
    render(this.#tripNoEventView, this.#tripContainer);
  }

  //Рисует все точки маршрута
  #renderPoints(points){
    points.forEach((point) => {
      this.#renderPoint(point);
    });
  }

  //Рисует одну точку маршрута
  #renderPoint (point) {
    const pointPresenter = new PointPresenter({tripEventListComponent:this.#tripEventListComponent.element,
      onPointUpdate: this.#handleViewAction,
      onModeChange: this.#handleModeChange});
    pointPresenter.init(point);
    this.#pointPresenters.set(point.id,pointPresenter);
  }

  #handleModeChange = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  };

  //Очистка всех представлений
  #clearPointPresenters(){
    this.#pointPresenters.forEach((presenter) => {
      presenter.destroy();
    });
    this.#pointPresenters.clear();
    //this.#newTaskPresenter.destroy();
  }

  // #handlePointUpdate = (updatedPoint) =>{
  //   this.#pointsModel.points = updateItem(this.#pointsModel.points, updatedPoint);
  //   this.#pointPresenters.get(updatedPoint.id).init(updatedPoint);
  // };


  get points() {
    const filterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;
    const filteredTasks = filter[filterType](points);

    switch (this.#currentSortType) {
      case SortType.DAY:
        return filteredTasks.sort(sortDay);
      case SortType.TIME:
        return filteredTasks.sort(sortTime);
      case SortType.PRICE:
        return filteredTasks.sort(sortPrice);
      default:
        return filteredTasks;
    }
  }


}
