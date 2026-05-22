from typing import Dict, Any
import pandas as pd
import sqlite3
import io
import contextlib

class CodeExecutionService:
    @staticmethod
    def execute_sql(query: str, schema: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute SQL query against a temporary in-memory SQLite database.
        """
        try:
            conn = sqlite3.connect(":memory:")
            
            # Setup demo data
            pd.DataFrame({
                "id": [1, 2, 3, 4],
                "name": ["Aarzu", "Zeeshan", "Meghana", "Sahil"],
                "department_id": [10, 10, 20, 30]
            }).to_sql("employees", conn, index=False)
            
            pd.DataFrame({
                "id": [10, 20, 30],
                "dept_name": ["Engineering", "Product", "Design"]
            }).to_sql("departments", conn, index=False)

            # Simulated execution
            df = pd.read_sql_query(query, conn)
            return {
                "success": True,
                "data": df.to_dict(orient="records"),
                "columns": df.columns.tolist(),
                "row_count": len(df)
            }
        except Exception as e:
            return {"error": str(e), "success": False}

    @staticmethod
    def execute_python(code: str) -> Dict[str, Any]:
        """
        Execute Python code in a safe sandbox (Simulated).
        """
        output = io.StringIO()
        try:
            with contextlib.redirect_stdout(output):
                exec(code, {"__builtins__": {}}, {})
            return {
                "success": True,
                "stdout": output.getvalue(),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": output.getvalue(),
                "error": str(e)
            }
