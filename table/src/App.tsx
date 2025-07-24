

import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./index.css";
import "./App.css";

type Artwork = {
  id: number;
  title?: string;
  place_of_origin?: string;
  artist_display?: string;
  date_start?: string | number;
  date_end?: string | number;
  [key: string]: any;
};

function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]); // Current page data
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [selectedRows, setSelectedRows] = useState<Record<number, Artwork>>({});
  const [selectCount, setSelectCount] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage]);

  const onPageChange = (e: { page: number }) => {
    setCurrentPage(e.page + 1); // Adjust 0-based index
  };

  const onRowSelectChange = (rowData: Artwork, selected: boolean) => {
    const updatedSelections = { ...selectedRows };
    if (selected) {
      updatedSelections[rowData.id] = rowData;
    } else {
      delete updatedSelections[rowData.id];
    }
    setSelectedRows(updatedSelections);
  };



  const isRowSelected = (rowData: Artwork) => !!selectedRows[rowData.id];

  // Select N rows globally
  const selectNRows = async (count: number | null) => {
    setIsSelecting(true);
    try {
      const updatedSelections = { ...selectedRows };
      let fetched = 0;
      let page = 1;
      while (fetched < (count ?? 0)) {
        const response = await fetch(
          `https://api.artic.edu/api/v1/artworks?page=${page}`
        );
        const data = await response.json();
        (data.data as Artwork[]).forEach((row: Artwork) => {
          if (fetched < (count ?? 0)) {
            updatedSelections[row.id] = row;
            fetched++;
          }
        });
        if (!data.pagination.next_url) break; // No more pages
        page++;
      }
      setSelectedRows(updatedSelections);
    } catch (error) {
      console.error("Error selecting rows:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="table-container animate-fade-in">
        <div className="table-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-lg)",
            }}
          >
            <h2 className="table-title">Artwork Collection</h2>
            <div className="attribution">Made by Anukarti Pandey</div>
          </div>
          <div className="table-controls">
            <div className="select-input-group">
              <label htmlFor="selectCount">Select rows:</label>
              <InputNumber
                id="selectCount"
                value={selectCount}
                onValueChange={(e) => setSelectCount(e.value ?? null)}
                placeholder="Enter number"
                min={1}
                max={totalRecords}
                showButtons
                buttonLayout="horizontal"
                step={1}
                inputStyle={{ width: '6rem' }}
              />
            </div>
            <Button
              label={isSelecting ? "Selecting..." : "Select N Rows"}
              className="btn-primary"
              onClick={() => selectNRows(selectCount)}
              disabled={!selectCount || loading || isSelecting}
              icon={
                isSelecting ? "pi pi-spin pi-spinner" : "pi pi-check-square"
              }
              loading={isSelecting}
              size="small"
            />
            {Object.keys(selectedRows).length > 0 && (
              <Button
                label={`Clear All (${Object.keys(selectedRows).length})`}
                className="btn-secondary"
                onClick={() => setSelectedRows({})}
                icon="pi pi-times"
                size="small"
              />
            )}
          </div>
        </div>

        <DataTable
          value={artworks}
          loading={loading}
          tableStyle={{ minWidth: "80rem" }}
          scrollable
          scrollHeight="60vh"
          selectionMode="checkbox"
          selection={Object.values(selectedRows) as Artwork[]}
          onSelectionChange={(e: { value: Artwork[] }) => {
            const newSelections: Record<number, Artwork> = {};
            e.value.forEach((row: Artwork) => {
              newSelections[row.id] = row;
            });
            setSelectedRows(newSelections);
          }}
          emptyMessage="No artworks found"
          className={loading ? "loading-overlay" : ""}
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            body={(rowData: Artwork) => (
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={isRowSelected(rowData)}
                onChange={(e) => onRowSelectChange(rowData, e.target.checked)}
              />
            )}
          />
          <Column
            field="title"
            header="Title"
            sortable
            body={(rowData: Artwork) => (
              <div
                style={{
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rowData.title || "Untitled"}
              </div>
            )}
          />
          <Column
            field="place_of_origin"
            header="Origin"
            body={(rowData: Artwork) => rowData.place_of_origin || "Unknown"}
          />
          <Column
            field="artist_display"
            header="Artist"
            body={(rowData: Artwork) => (
              <div
                style={{
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rowData.artist_display || "Unknown Artist"}
              </div>
            )}
          />
          <Column
            field="date_start"
            header="Date Start"
            body={(rowData: Artwork) => rowData.date_start || "N/A"}
          />
          <Column
            field="date_end"
            header="Date End"
            body={(rowData: Artwork) => rowData.date_end || "N/A"}
          />
        </DataTable>

        <Paginator
          first={(currentPage - 1) * pageSize}
          rows={pageSize}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          className="custom-paginator"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} artworks"
        />
      </div>
    </div>
  );
}

export default App;
