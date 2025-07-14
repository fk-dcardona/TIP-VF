from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import uuid

db = SQLAlchemy()

class Organization(db.Model):
    """Organization model for multi-tenancy"""
    __tablename__ = 'organizations'
    
    id = db.Column(db.String(100), primary_key=True)  # Clerk organization ID
    name = db.Column(db.String(255), nullable=False)
    domain = db.Column(db.String(255))  # For domain-based assignment
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploads = db.relationship('Upload', backref='organization', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'domain': self.domain,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }

class Upload(db.Model):
    """Upload model with organization support"""
    __tablename__ = 'uploads'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.String(100), nullable=False)  # Clerk user ID
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)  # Clerk organization ID
    status = db.Column(db.String(50), default='uploaded')  # uploaded, processing, completed, error
    row_count = db.Column(db.Integer, default=0)
    column_count = db.Column(db.Integer, default=0)
    data_summary = db.Column(db.Text)  # JSON string with data summary
    error_message = db.Column(db.Text)
    
    # Relationships
    processed_data = db.relationship('ProcessedData', backref='upload', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'user_id': self.user_id,
            'org_id': self.org_id,
            'status': self.status,
            'row_count': self.row_count,
            'column_count': self.column_count,
            'data_summary': json.loads(self.data_summary) if self.data_summary else None,
            'error_message': self.error_message
        }

class ProcessedData(db.Model):
    """Processed data model with organization support"""
    __tablename__ = 'processed_data'
    
    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'), nullable=False)
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)  # Clerk organization ID
    data_type = db.Column(db.String(50), nullable=False)  # inventory, supplier, shipment
    processed_data = db.Column(db.Text, nullable=False)  # JSON string with processed data
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'upload_id': self.upload_id,
            'org_id': self.org_id,
            'data_type': self.data_type,
            'processed_data': json.loads(self.processed_data) if self.processed_data else None,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class Agent(db.Model):
    """AI Agent model for organization-specific automation"""
    __tablename__ = 'agents'
    
    id = db.Column(db.Integer, primary_key=True)
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    user_id = db.Column(db.String(100), nullable=False)  # Creator's Clerk user ID
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    agent_type = db.Column(db.String(50), nullable=False)  # inventory_monitor, supplier_evaluator, demand_forecaster
    configuration = db.Column(db.Text)  # JSON string with agent configuration
    status = db.Column(db.String(50), default='active')  # active, paused, error
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_run = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'org_id': self.org_id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'agent_type': self.agent_type,
            'configuration': json.loads(self.configuration) if self.configuration else None,
            'status': self.status,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
            'last_run': self.last_run.isoformat() if self.last_run else None
        }

# Supply Chain Triangle Analytics Models
class TriangleScore(db.Model):
    __tablename__ = 'triangle_scores'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Triangle Vertex Scores (0-100)
    service_score = db.Column(db.Float, nullable=False)
    cost_score = db.Column(db.Float, nullable=False)
    capital_score = db.Column(db.Float, nullable=False)
    overall_score = db.Column(db.Float, nullable=False)  # Harmonic mean
    
    # Component Metrics (JSON)
    metrics = db.Column(db.Text)  # JSON string with detailed metrics
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    organization = db.relationship('Organization', backref=db.backref('triangle_scores', lazy=True))

class ProductAnalytics(db.Model):
    __tablename__ = 'product_analytics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    sku = db.Column(db.String(255), nullable=False)
    
    # Core Metrics
    current_stock = db.Column(db.Float, nullable=False, default=0)
    sales_velocity = db.Column(db.Float, nullable=False, default=0)  # units/day
    days_of_supply = db.Column(db.Integer, nullable=False, default=0)
    inventory_turnover = db.Column(db.Float, nullable=False, default=0)
    
    # Financial Metrics
    unit_cost = db.Column(db.Float, nullable=False, default=0)
    selling_price = db.Column(db.Float, nullable=False, default=0)
    gross_margin = db.Column(db.Float, nullable=False, default=0)
    roi_percentage = db.Column(db.Float, nullable=False, default=0)
    
    # Operational Metrics
    reorder_point = db.Column(db.Float)
    lead_time_days = db.Column(db.Integer, default=7)
    safety_stock_days = db.Column(db.Integer, default=3)
    
    # Status
    stock_status = db.Column(db.String(20))  # healthy, low_stock, stockout, excess
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('org_id', 'sku'),)
    organization = db.relationship('Organization', backref=db.backref('product_analytics', lazy=True))

class SupplierPerformance(db.Model):
    __tablename__ = 'supplier_performance'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    supplier_name = db.Column(db.String(255), nullable=False)
    
    # Performance Scores (0-100)
    delivery_score = db.Column(db.Float, default=0)
    quality_score = db.Column(db.Float, default=0)
    cost_score = db.Column(db.Float, default=0)
    responsiveness_score = db.Column(db.Float, default=0)
    overall_score = db.Column(db.Float, default=0)
    
    # Metrics
    on_time_delivery_rate = db.Column(db.Float, default=0)
    defect_rate = db.Column(db.Float, default=0)
    price_variance = db.Column(db.Float, default=0)
    average_response_hours = db.Column(db.Integer, default=24)
    
    last_evaluated = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('org_id', 'supplier_name'),)
    organization = db.relationship('Organization', backref=db.backref('supplier_performance', lazy=True))

class FinancialMetrics(db.Model):
    __tablename__ = 'financial_metrics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    period_date = db.Column(db.Date, nullable=False)
    
    # Working Capital
    inventory_value = db.Column(db.Float, nullable=False, default=0)
    accounts_receivable = db.Column(db.Float, default=0)
    accounts_payable = db.Column(db.Float, default=0)
    working_capital = db.Column(db.Float, default=0)
    working_capital_ratio = db.Column(db.Float, default=0)
    
    # Cash Conversion
    days_inventory_outstanding = db.Column(db.Integer, default=0)
    days_sales_outstanding = db.Column(db.Integer, default=0)
    days_payable_outstanding = db.Column(db.Integer, default=0)
    cash_conversion_cycle = db.Column(db.Integer, default=0)
    
    # Efficiency
    inventory_turnover = db.Column(db.Float, default=0)
    return_on_capital_employed = db.Column(db.Float, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('org_id', 'period_date'),)
    organization = db.relationship('Organization', backref=db.backref('financial_metrics', lazy=True))

class AlertRule(db.Model):
    __tablename__ = 'alert_rules'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)
    metric_name = db.Column(db.String(100), nullable=False)
    condition = db.Column(db.String(20), nullable=False)  # greater_than, less_than, equals, between
    threshold_value = db.Column(db.Float)
    threshold_min = db.Column(db.Float)
    threshold_max = db.Column(db.Float)
    severity = db.Column(db.String(20), nullable=False)  # critical, high, medium, low
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    organization = db.relationship('Organization', backref=db.backref('alert_rules', lazy=True))

class AlertInstance(db.Model):
    __tablename__ = 'alert_instances'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    alert_rule_id = db.Column(db.String(36), db.ForeignKey('alert_rules.id'))
    sku = db.Column(db.String(255))
    metric_value = db.Column(db.Float)
    severity = db.Column(db.String(20))
    status = db.Column(db.String(20), default='active')  # active, acknowledged, resolved
    message = db.Column(db.Text)
    action_required = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    acknowledged_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    
    organization = db.relationship('Organization', backref=db.backref('alert_instances', lazy=True))
    alert_rule = db.relationship('AlertRule', backref=db.backref('instances', lazy=True))

# Trade Document Models
class TradeDocument(db.Model):
    __tablename__ = 'trade_documents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    document_number = db.Column(db.String(100))
    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'))
    
    # Extracted metadata
    extracted_data = db.Column(db.JSON)
    extraction_confidence = db.Column(db.Float)
    
    # Dates
    document_date = db.Column(db.Date)
    processed_at = db.Column(db.DateTime)
    
    # Status
    status = db.Column(db.String(50))
    validation_errors = db.Column(db.JSON)
    
    organization = db.relationship('Organization', backref=db.backref('trade_documents', lazy=True))
    upload = db.relationship('Upload', backref=db.backref('trade_document', uselist=False))

class DocumentAnalytics(db.Model):
    __tablename__ = 'document_analytics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    period_date = db.Column(db.Date, nullable=False)
    
    # Document metrics
    total_documents = db.Column(db.Integer, default=0)
    digital_percentage = db.Column(db.Float, default=0)
    average_processing_time = db.Column(db.Float, default=0)
    
    # Compliance metrics
    compliance_score = db.Column(db.Float, default=0)
    violation_count = db.Column(db.Integer, default=0)
    audit_ready_percentage = db.Column(db.Float, default=0)
    
    # Efficiency metrics
    automation_rate = db.Column(db.Float, default=0)
    error_rate = db.Column(db.Float, default=0)
    rework_percentage = db.Column(db.Float, default=0)
    
    __table_args__ = (db.UniqueConstraint('org_id', 'period_date'),)
    organization = db.relationship('Organization', backref=db.backref('document_analytics', lazy=True))

class ShipmentTracking(db.Model):
    __tablename__ = 'shipment_tracking'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    shipment_number = db.Column(db.String(100), unique=True)
    
    # Document references
    po_document_id = db.Column(db.String(36))
    invoice_document_id = db.Column(db.String(36))
    bol_document_id = db.Column(db.String(36))
    
    # Timeline
    po_date = db.Column(db.Date)
    ship_date = db.Column(db.Date)
    eta_date = db.Column(db.Date)
    actual_delivery_date = db.Column(db.Date)
    
    # Status tracking
    current_status = db.Column(db.String(50))
    milestone_data = db.Column(db.JSON)
    
    organization = db.relationship('Organization', backref=db.backref('shipment_tracking', lazy=True))