from dataclasses import dataclass
from typing import Annotated, Generic, TypeVar

from fastapi import Depends, Query
from pydantic import BaseModel

T = TypeVar("T")


@dataclass
class PageParams:
    skip: int
    take: int


def page_params(
    skip: Annotated[int, Query(ge=0)] = 0,
    take: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PageParams:
    return PageParams(skip=skip, take=take)


Pagination = Annotated[PageParams, Depends(page_params)]


class Page(BaseModel, Generic[T]):
    data: list[T]
    total: int
    skip: int
    take: int


def make_page(data: list, total: int, params: PageParams) -> dict:
    return {"data": data, "total": total, "skip": params.skip, "take": params.take}
