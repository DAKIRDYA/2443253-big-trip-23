import ApiService from './framework/api-service.js';

const Method = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE'
};

export default class PointsApiService extends ApiService {
  get points() {
    return this._load({url: 'points'})
      .then(ApiService.parseResponse);
  }

  get destinations() {
    return this._load({url: 'destinations'})
      .then(ApiService.parseResponse);
  }

  get offers() {
    return this._load({url: 'offers'})
      .then(ApiService.parseResponse);
  }

  async addPoint(point) {
    const response = await this._load({
      url: 'points',
      method: Method.POST,
      body: JSON.stringify(this.#adaptToServer(point)),
      headers: new Headers({'Content-Type': 'application/json'}),
    });

    const parsedResponse = await ApiService.parseResponse(response);
    return parsedResponse;
  }

  async deletePoint(point) {
    const response = await this._load({
      url: `points/${point.id}`,
      method: Method.DELETE,
    });
    return response;
  }

  async updatePoint(point) {
    const response = await this._load({
      url: `points/${point.id}`,
      method: Method.PUT,
      body: JSON.stringify(this.#adaptToServer(point)),
      headers: new Headers({'Content-Type': 'application/json'}),
    });

    const parsedResponse = await ApiService.parseResponse(response);

    return parsedResponse;
  }

  //Обратная адаптация для сервера
  #adaptToServer(point) {

    const adaptedPoint = {
      'base_price' : Number(point.basePrice),
      'date_from' : point.dateFrom instanceof Date ? point.dateFrom.toISOString() : null, // На сервере дата хранится в ISO формате
      'date_to' : point.dateTo instanceof Date ? point.dateTo.toISOString() : null, // На сервере дата хранится в ISO формате
      'destination': point.destination.id,
      'is_favorite' : point.isFavorite,
      'offers': point.offers.map((offer) => offer.id),
      'type': point.type,

    };

    // Ненужные ключи мы удаляем
    // delete adaptedPoint.basePrice;
    // delete adaptedPoint.dateFrom;
    // delete adaptedPoint.dateTo;
    // delete adaptedPoint.isFavorite;
    // delete adaptedPoint.time;
    // delete adaptedPoint.availableOffers;

    //Добавим продолжительность, адаптируем пункты назначения и предложения
    return adaptedPoint;

  }
}