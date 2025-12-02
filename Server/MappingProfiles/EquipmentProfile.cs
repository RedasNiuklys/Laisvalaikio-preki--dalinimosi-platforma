using AutoMapper;
using Server.DataTransferObjects;
using Server.Models;

namespace Server.MappingProfiles
{
    public class EquipmentProfile : Profile
    {
        public EquipmentProfile()
        {
            // Equipment -> EquipmentResponseDto
            CreateMap<Equipment, EquipmentResponseDto>()
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.Location, opt => opt.MapFrom(src => src.Location))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images))
                .ForMember(dest => dest.Bookings, opt => opt.MapFrom(src => src.Bookings));

            // CreateEquipmentDto -> Equipment (for creating)
            CreateMap<CreateEquipmentDto, Equipment>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Bookings, opt => opt.Ignore())
                .ForMember(dest => dest.MaintenanceHistory, opt => opt.Ignore())
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.Location, opt => opt.Ignore())
                .ForMember(dest => dest.Owner, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => src.CategoryId));

            // UpdateEquipmentDto -> Equipment (for updating)
            // Note: For partial updates, map manually in controller to handle null values
            CreateMap<UpdateEquipmentDto, Equipment>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Bookings, opt => opt.Ignore())
                .ForMember(dest => dest.MaintenanceHistory, opt => opt.Ignore())
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.Location, opt => opt.Ignore())
                .ForMember(dest => dest.Owner, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category));

            // Category -> CategoryDto
            CreateMap<Category, CategoryDto>();

            // Location -> LocationDto
            CreateMap<Location, LocationDto>();

            // EquipmentImage -> EquipmentImageDto
            CreateMap<EquipmentImage, EquipmentImageDto>();

            // Booking -> BookingDto
            CreateMap<Booking, BookingDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}

