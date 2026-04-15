from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc
from fastapi import HTTPException
from datetime import datetime
from typing import Optional, List
from app.models.travels import Travel, TravelDestination, TravelGuide
from app.schemas.travels import TravelCreate, TravelStart, TravelFinish, TravelDeliver, GuideType
from app.models.users import User
from app.models.trucks import Truck


def create_travel_service(db: Session, travel_in: TravelCreate, current_user):  # pylint: disable=unused-argument
    try:
        db_travel = Travel(
            truck_id=travel_in.truck_id,
            driver_id=travel_in.driver_id,
            official_id=travel_in.official_id,
            extra_official_id=travel_in.extra_official_id,
            material_type=travel_in.material_type,
            weight_kg=travel_in.weight_kg,
            status="cargado"
        )
        db.add(db_travel)
        db.flush()  # Obtenemos el ID del viaje recién creado

        # --- CONECTAR EL VIAJE CON EL CAMIÓN (Para que salga 'En Ruta') ---
        truck = db.query(Truck).filter(Truck.id == travel_in.truck_id).first()
        if truck:
            truck.current_travel_id = db_travel.id
            truck.status = "activo"  # <-- Aseguramos el estado de forma explícita
            db.add(truck)  # <-- Forzamos el guardado en la sesión
        # ------------------------------------------------------------------

        for dest_in in travel_in.destinations:
            db_dest = TravelDestination(
                travel_id=db_travel.id,
                client_name=dest_in.client_name,
                status="pendiente"
            )
            db.add(db_dest)
            db.flush()

            for guide_in in dest_in.load_photos:
                db_guide = TravelGuide(
                    destination_id=db_dest.id,
                    photo_url=guide_in.photo_url,
                    guide_type=GuideType.carga,
                    weight_kg=guide_in.weight_kg
                )
                db.add(db_guide)

        db.commit()
        db.refresh(db_travel)
        return db_travel

    except Exception as e:
        db.rollback()
        import traceback
        print("\n\n=== ALERTA: ERROR CRÍTICO EN CREATE_TRAVEL_SERVICE ===")
        print(traceback.format_exc())
        print("=====================================================\n\n")
        raise HTTPException(status_code=500, detail=str(e)) from e


def start_travel_service(db: Session, travel_id: int, travel_in: TravelStart, _current_user: User) -> Travel:
    travel = db.query(Travel).filter(Travel.id == travel_id).first()
    if not travel:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if travel.status != "cargado":
        raise HTTPException(
            status_code=400, detail="Solo se puede iniciar un viaje en estado 'cargado'")

    travel.status = "en_curso"
    travel.start_odometer = travel_in.start_odometer
    travel.start_odometer_photo_url = travel_in.start_odometer_photo_url
    travel.start_time = datetime.now()

    db.add(travel)
    db.commit()
    db.refresh(travel)
    return travel


def deliver_travel_service(db: Session, travel_id: int, travel_in: TravelDeliver, _current_user: User) -> Travel:
    travel = db.query(Travel).filter(Travel.id == travel_id).first()
    if not travel:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if travel.status != "en_curso":
        raise HTTPException(
            status_code=400, detail="El viaje debe estar 'en_curso' para reportar entregas")

    for dest_in in travel_in.delivered_destinations:
        db_dest = db.query(TravelDestination).filter(
            TravelDestination.id == dest_in.destination_id).first()
        if db_dest and db_dest.status == "pendiente":
            db_dest.status = "entregado"

            for photo in dest_in.delivery_photos:
                db_guide = TravelGuide(
                    destination_id=db_dest.id,
                    photo_url=photo.photo_url,
                    guide_type=GuideType.entrega,
                    weight_kg=photo.weight_kg
                )
                db.add(db_guide)

    db.flush()

    todos_entregados = all(
        d.status == "entregado" for d in travel.destinations)

    if todos_entregados:
        travel.status = "retornando"
        travel.delivered_at = datetime.now()

    db.commit()
    db.refresh(travel)
    return travel


def finish_travel_service(db: Session, travel_id: int, travel_in: TravelFinish, _current_user: User) -> Travel:
    travel = db.query(Travel).filter(Travel.id == travel_id).first()
    if not travel:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if travel.status != "retornando":
        raise HTTPException(
            status_code=400, detail="El viaje debe estar 'retornando' para finalizar en base")

    if travel_in.end_odometer <= travel.start_odometer:
        raise HTTPException(
            status_code=400,
            detail=f"El kilometraje final ({travel_in.end_odometer}) debe ser mayor al inicial ({travel.start_odometer})"
        )

    travel.status = "finalizado"
    travel.end_odometer = travel_in.end_odometer
    travel.end_odometer_photo_url = travel_in.end_odometer_photo_url
    travel.end_time = datetime.now()

    truck = db.query(Truck).filter(Truck.id == travel.truck_id).first()
    if truck:
        truck.current_travel_id = None
        truck.status = "inactivo"
        db.add(truck)
    # ----------------------------------------------------------------

    db.add(travel)
    db.commit()
    db.refresh(travel)
    return travel


def get_active_trip_for_truck_service(db: Session, truck_id: int) -> Optional[Travel]:
    return db.query(Travel).filter(
        Travel.truck_id == truck_id,
        Travel.status.in_(["cargado", "en_curso", "retornando"])
    ).first()


def get_truck_history_service(db: Session, truck_id: int, skip: int = 0, limit: int = 20) -> List[Travel]:
    return db.query(Travel).options(
        selectinload(Travel.destinations).selectinload(
            TravelDestination.guides)
    ).filter(
        Travel.truck_id == truck_id,
        Travel.status.in_(["finalizado", "liquidado"])
    ).order_by(desc(Travel.end_time)).offset(skip).limit(limit).all()


def get_travels_service(db: Session, _current_user: User, skip: int = 0, limit: int = 100):
    query = db.query(Travel).options(
        selectinload(Travel.destinations).selectinload(
            TravelDestination.guides)
    )
    return query.offset(skip).limit(limit).all()
