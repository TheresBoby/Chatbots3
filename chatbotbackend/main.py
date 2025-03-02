import os
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import json
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")  # Path to your JSON key file
firebase_admin.initialize_app(cred)
db = firestore.client()


def read_data(id=''):
    if(id == ''):
        collection_ref = db.collection("laptops")
        docs = collection_ref.get()
        laps = []
        for doc in docs:
            laps.append(doc.id)
        return laps
    else:
        lap_ref = db.collection("laptops").document(id)
        doc = lap_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

def get_laptops_by_brand(brand):
    """Fetch laptops by brand prefix from Firestore"""
    try:
        collection_ref = db.collection("laptops")
        # Query for documents where ID starts with the brand prefix
        brand_prefix = brand.upper() + '_'
        print(f"Searching with prefix: {brand_prefix}")  # Debug log
        
        # Get all documents and filter by prefix
        docs = collection_ref.get()
        matching_docs = [doc for doc in docs if doc.id.startswith(brand_prefix)]
        
        print(f"Found {len(matching_docs)} matching documents")  # Debug log
        return [doc.id for doc in matching_docs]
    except Exception as e:
        print(f"Error in get_laptops_by_brand: {str(e)}")  # Debug log
        return []

# Add this after your existing Firebase initialization
def update_scheduled_purchase(user_id: str, laptop_id: str, max_amount: float, current_price: float):
    """Update or add a scheduled purchase to Firebase"""
    try:
        scheduled_ref = db.collection("scheduled_purchases").document(f"{user_id}_{laptop_id}")
        scheduled_ref.set({
            "user_id": user_id,
            "laptop_id": laptop_id,
            "max_amount": max_amount,
            "current_price": current_price,
            "notify": current_price > max_amount,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        return True
    except Exception as e:
        print(f"Error updating scheduled purchase: {str(e)}")
        return False

def get_user_scheduled_purchases(user_id: str):
    """Get all scheduled purchases for a user"""
    try:
        scheduled_ref = db.collection("scheduled_purchases")
        query = scheduled_ref.where("user_id", "==", user_id)
        docs = query.get()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"Error getting scheduled purchases: {str(e)}")
        return []

# Load environment variables
load_dotenv()

# Configuration class with environment variables
class Config:
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11501")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")  # Default frontend URL

# Brand information for linking to frontend UI actions
LAPTOP_BRANDS = {
    "hp": {
        "brand_id": "hp",
        "navigate_action": "handleLaptopClick",
        "ui_trigger": "triggerBrandView"
    },
    "dell": {
        "brand_id": "dell",
        "navigate_action": "handleLaptopClick",
        "ui_trigger": "triggerBrandView"
    },
    "asus": {
        "brand_id": "asus",
        "navigate_action": "handleLaptopClick",
        "ui_trigger": "triggerBrandView"
    },
    "samsung": {
        "brand_id": "samsung",
        "navigate_action": "handleLaptopClick",
        "ui_trigger": "triggerBrandView"
    },
    "apple": {
        "brand_id": "apple",
        "navigate_action": "handleLaptopClick",
        "ui_trigger": "triggerBrandView"
    },
}

# Buffer memory for scheduled purchases
SCHEDULED_PURCHASES = {
    #Structure: laptop_id: { max_amount: float, current_price: float, notify: bool }
}

# Add this helper function
def update_scheduled_purchase(laptop_id: str, max_amount: float, current_price: float):
    """Update or add a scheduled purchase to the buffer memory"""
    SCHEDULED_PURCHASES[laptop_id] = {
        "max_amount": max_amount,
        "current_price": current_price,
        "notify": current_price > max_amount
    }

# Add this helper function

async def check_price_updates():
    """Check for price updates on scheduled purchases"""
    for laptop_id, details in SCHEDULED_PURCHASES.items():
        laptop_info = read_data(laptop_id)
        if laptop_info:
            new_price = float(laptop_info.get('price', '0').replace('₹', '').replace(',', ''))
            if new_price <= details["max_amount"] and details["notify"]:
                # Price has dropped below max amount!
                details["current_price"] = new_price
                details["notify"] = False
                # You could implement notification logic here
                print(f"Price alert! {laptop_id} is now available within budget!")

# Your existing SUPPORT_CONTEXTS dictionary remains the same
SUPPORT_CONTEXTS = {
    "billing": """You are a helpful customer support agent for a laptop selling website. 
    Assist the customer with billing-related inquiries, such as payment methods, 
    invoice details, and refund processes.""",
    
    "technical": """You are a technical support agent for a laptop selling website. 
    Provide detailed, step-by-step troubleshooting guidance for laptop issues, 
    including hardware and software problems.""",
    
    "product_inquiry": """You are a product expert for a laptop selling website. 
    Help customers understand laptop specifications, compare models, 
    and provide recommendations based on their needs."""
}

class LaptopSupportChatbot:
    def __init__(self):
        try:
            self.llm = Ollama(
                model=Config.OLLAMA_MODEL,
                base_url=Config.OLLAMA_BASE_URL
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Ollama LLM: {str(e)}"
            )

    def create_context_prompt(self, context_type: str) -> PromptTemplate:
        return PromptTemplate(
            template="{context}\n\nCustomer Query: {query}\n\nResponse:",
            input_variables=["context", "query"]
        )

    def generate_response(self, context_type: str, query: str) -> str:
        try:
            context = SUPPORT_CONTEXTS.get(context_type)
            if not context:
                raise ValueError(f"Invalid context type: {context_type}")
                
            prompt = self.create_context_prompt(context_type)
            full_prompt = prompt.format(context=context, query=query)
            response = self.llm.invoke(full_prompt)
            return response
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating response: {str(e)}"
            )

# Update the SupportRequest model to include user_id
class SupportRequest(BaseModel):
    context: str = Field(default="product_inquiry", description="Support context type")
    query: str = Field(..., description="Customer's support query")
    info: str = Field(default="", description="Type defines here")
    user_id: str = Field(default="", description="User ID from Firebase Auth")

class SupportResponse(BaseModel):
    response: str
    context: str
    status: str = "success"
    info: str
    ui_actions: List[Dict[str, str]] = []

# Initialize FastAPI app
app = FastAPI(
    title="Laptop Support Chatbot",
    description="AI-powered customer support chatbot for laptop sales"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[Config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chatbot
try:
    chatbot = LaptopSupportChatbot()
except Exception as e:
    print(f"Error initializing chatbot: {str(e)}")
    raise

# Static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

def detect_brand_mentions(query: str) -> List[Dict[str, str]]:
    """Detect mentions of laptop brands in the query and return UI actions"""
    ui_actions = []
    
    # Convert query to lowercase for case-insensitive matching
    query_lower = query.lower()
    
    # Check for brand mentions
    for brand, data in LAPTOP_BRANDS.items():
        if brand in query_lower:
            ui_actions.append({
                "type": "navigate",
                "brandId": data["brand_id"],
                "action": data["navigate_action"]
            })
    
    return ui_actions

@app.post("/support", response_model=SupportResponse)
async def handle_support_request(request: SupportRequest):
    response_text = ''
    ui_actions = []
    
    if request.info == '':
# Check if query contains brand mentions
        brand_found = False
        for brand in LAPTOP_BRANDS.keys():
            if brand.lower() in request.query.lower():
                brand_found = True
                try:
                    # Add UI action to trigger brand view
                    ui_actions.append({
                        "type": LAPTOP_BRANDS[brand]["ui_trigger"],
                        "brand": brand.lower()
                    })
                    
                    brand_laptops = get_laptops_by_brand(brand)
                    if brand_laptops:
                        response_text = f"Here are the available {brand.upper()} laptops:\n\n"
                        for laptop_id in brand_laptops:
                            # Get full laptop details
                            laptop_details = read_data(laptop_id)
                            if laptop_details:
                                model_name = laptop_details.get('title', laptop_id)
                                price = laptop_details.get('price', 'N/A')
                                response_text += f"~{model_name} - {price}<br>"
                                response_text += f'<button id="view" data-message="{laptop_id}" data-type="view" type="button" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2">View configuration</button>'
                                response_text += f'<button id="buy" data-message="{laptop_id}" data-type="buy" type="button" class="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50 mr-2">Buy Now</button>'
                                response_text += f'<button id="schedule" data-message="{laptop_id}" data-type="schedule" type="button" class="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50">Schedule Purchase</button><br><br>'
                    else:
                        response_text = f"Sorry, we don't have any {brand.upper()} laptops in stock at the moment."
                    break
                except Exception as e:
                    print(f"Error fetching laptops: {str(e)}")  # Debug log
                    response_text = f"Error fetching {brand.upper()} laptops: {str(e)}"
                break
        
        # If no brand was mentioned, use Llama for general inquiries
        if not brand_found:
            try:
                response_text = chatbot.generate_response(
                    context_type=request.context,
                    query=request.query
                )
                print(f"Llama response: {response_text}")  # Debug log
            except Exception as e:
                print(f"Error generating Llama response: {str(e)}")
                response_text = "I apologize, but I'm having trouble processing your request at the moment."
    
    elif request.info == 'view':
        laptop_details = read_data(request.query)
        if laptop_details:
            # Format laptop details with description instead of specifications
            response_text = {
                "title": laptop_details.get("title", "N/A"),
                "price": laptop_details.get("price", "N/A"),
                "discountPrice": laptop_details.get("discountPrice", "N/A"),
                "rating": laptop_details.get("rating", "N/A"),
                "discount": laptop_details.get("discount", "N/A"),
                "image": laptop_details.get("image", "N/A"),
                "description": laptop_details.get("description", {})  # Changed from specifications to description
            }
        else:
            response_text = {"error": "Laptop details not found"}
        
        return SupportResponse(
            response=json.dumps(response_text),
            context=request.context,
            info=request.info,
            ui_actions=ui_actions
        )

    elif request.info == 'buy':
        # Handle buy now action
        laptop_details = read_data(request.query)
        if laptop_details:
            laptop_name = laptop_details.get('title', request.query)
            response_text = f"Thank you for your purchase! You have successfully bought the {laptop_name}."
        else:
            response_text = "Error: Could not find laptop details"
        
        return SupportResponse(
            response=response_text,
            context=request.context,
            info=request.info,
            ui_actions=ui_actions
        )

    elif request.info == 'schedule':
        # Initial schedule request - ask for max amount
        laptop_details = read_data(request.query)
        if laptop_details:
            laptop_name = laptop_details.get('title', request.query)
            response_text = f"Please enter the maximum amount you can afford for {laptop_name} (numbers only):"
        else:
            response_text = "Error: Could not find laptop details"
        
        return SupportResponse(
            response=response_text,
            context=request.context,
            info='schedule',
            ui_actions=ui_actions
        )
        # When submitting the schedule amount

    elif request.info == 'schedule_amount':
        try:
            if not request.user_id:
                return SupportResponse(
                    response="Please login to schedule a purchase.",
                    context=request.context,
                    info='schedule',
                    ui_actions=ui_actions
                )

            max_amount = float(request.query.replace('₹', '').replace(',', ''))
            laptop_id = request.context
            
            laptop_details = read_data(laptop_id)
            if not laptop_details:
                return SupportResponse(
                    response=f"Error: Could not find details for the selected laptop",
                    context=request.context,
                    info=request.info,
                    ui_actions=ui_actions
                )
            
            price_str = laptop_details.get('price', '0')
            current_price = float(price_str.replace('₹', '').replace(',', ''))
            laptop_name = laptop_details.get('title', laptop_id)
            
            # Update in Firebase
            success = update_scheduled_purchase(
                user_id=request.user_id,
                laptop_id=laptop_id,
                max_amount=max_amount,
                current_price=current_price
            )
            
            if not success:
                return SupportResponse(
                    response="Failed to save your scheduled purchase. Please try again.",
                    context=request.context,
                    info=request.info,
                    ui_actions=ui_actions
                )

            # Get user's scheduled items count
            scheduled_items = get_user_scheduled_purchases(request.user_id)
            scheduled_count = len([item for item in scheduled_items if item["notify"]])
            
            if current_price <= max_amount:
                response_text = (
                    f"Great news! The {laptop_name} (₹{current_price:,.2f}) is within "
                    f"your budget of ₹{max_amount:,.2f}. Your purchase has been confirmed!"
                )
            else:
                response_text = (
                    f"The {laptop_name} currently costs ₹{current_price:,.2f}, which is above "
                    f"your maximum budget of ₹{max_amount:,.2f}. We'll notify you when the "
                    f"price drops below your budget.\n\n"
                    f"You have {scheduled_count} laptop(s) in your scheduled purchases."
                )
            
            return SupportResponse(
                response=response_text,
                context=request.context,
                info=request.info,
                ui_actions=ui_actions
            )
            
        except ValueError:
            return SupportResponse(
                response="Please enter a valid number for the maximum amount (e.g., 50000).",
                context=request.context,
                info='schedule',  # Reset to schedule to try again
                ui_actions=ui_actions
            )
        except Exception as e:
            print(f"Error in schedule_amount: {str(e)}")  # Debug log
            return SupportResponse(
                response="An error occurred while processing your request. Please try again.",
                context=request.context,
                info=request.info,
                ui_actions=ui_actions
            )

    return SupportResponse(
        response=response_text,
        context=request.context,
        info=request.info,
        ui_actions=ui_actions
    )

@app.get("/scheduled-purchases")
async def get_scheduled_purchases():
    """Return all scheduled purchases"""
    scheduled_items = []
    for laptop_id, details in SCHEDULED_PURCHASES.items():
        laptop_info = read_data(laptop_id)
        if laptop_info:
            scheduled_items.append({
                "id": laptop_id,
                "title": laptop_info.get('title', laptop_id),
                "max_amount": details["max_amount"],
                "current_price": details["current_price"],
                "notify": details["notify"]
            })
    return {"scheduled_items": scheduled_items}

@app.get("/user-scheduled-purchases/{user_id}")
async def get_user_purchases(user_id: str):
    """Return all scheduled purchases for a user"""
    scheduled_items = get_user_scheduled_purchases(user_id)
    
    # Enrich with laptop details
    enriched_items = []
    for item in scheduled_items:
        laptop_info = read_data(item["laptop_id"])
        if laptop_info:
            enriched_items.append({
                **item,
                "laptop_title": laptop_info.get("title"),
                "laptop_image": laptop_info.get("image"),
                "current_market_price": laptop_info.get("price")
            })
    
    return {"scheduled_items": enriched_items}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "detail": exc.detail}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)